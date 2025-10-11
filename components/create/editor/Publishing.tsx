import { Dialog } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { PollingTimeout, poll } from "@zeitgeistpm/avatara-util";
import {
  CreateMarketParams,
  IOForeignAssetId,
  IOZtgAssetId,
  RpcContext,
  ZTG,
  isFullSdk,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import { prepareCombinatorialPoolParams } from "lib/state/market-creation/types/form";
import { StorageError } from "@zeitgeistpm/web3.storage";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import {
  getMetadataForCurrency,
  supportedCurrencies,
} from "lib/constants/supported-currencies";
import { checkMarketExists } from "lib/gql/markets";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useFeePayingAsset } from "lib/hooks/queries/useFeePayingAsset";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import { NotificationType, useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { assetsAreEqual } from "lib/util/assets-are-equal";
import { formatNumberCompact } from "lib/util/format-compact";
import { isArray } from "lodash-es";
import { useRouter } from "next/router";
import { useState } from "react";
import { LuFileWarning } from "react-icons/lu";
import { RiSendPlaneLine } from "react-icons/ri";
import { GraphQLClient } from "graphql-request";

export type PublishingProps = {
  editor: MarketDraftEditor;
  creationParams?: CreateMarketParams<RpcContext>;
};

export const Publishing = ({ editor, creationParams }: PublishingProps) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const router = useRouter();
  const notifications = useNotifications();
  const [isTransacting, setIsTransacting] = useState(false);
  const [totalCostIsOpen, setTotalCostIsOpen] = useState(false);
  const { data: constants } = useChainConstants();

  const feesEnabled = !(
    !sdk ||
    !creationParams ||
    !editor.isValid ||
    !wallet.activeAccount
  );

  const { data: baseFee } = useQuery(
    [creationParams?.metadata, wallet.activeAccount?.address],
    async () => {
      if (!feesEnabled) {
        return new Decimal(0);
      }
      const paymentInfo =
        await sdk.model.markets.create.calculateFees(creationParams);
      return new Decimal(paymentInfo.partialFee.toString() ?? 0).div(ZTG);
    },
    {
      initialData: new Decimal(0),
      enabled: feesEnabled,
    },
  );

  const { data: feeDetails } = useFeePayingAsset(baseFee);

  const firstInvalidStep = editor.steps.find((step) => !step.isValid);

  const baseCurrency = supportedCurrencies.find(
    (a) => a.name === editor.form.currency,
  );

  const { data: ztgBalance } = useBalance(wallet.realAddress, {
    Ztg: null,
  });

  const { data: foreignAssetBalance } = useBalance(
    wallet.realAddress,
    baseCurrency?.assetId,
  );

  const bondCost =
    editor.form.moderation === "Permissionless"
      ? constants?.markets.validityBond
      : constants?.markets.advisoryBond;

  const oracleBond = constants?.markets.oracleBond;

  const ztgTransactionFee = IOZtgAssetId.is(feeDetails?.assetId)
    ? feeDetails?.amount
    : new Decimal(0);

  const ztgCost = new Decimal(bondCost ?? 0)
    .plus(oracleBond ?? 0)
    .plus(
      editor.form.moderation === "Permissionless" &&
        editor.form.liquidity?.deploy &&
        editor.form.currency === "ZTG"
        ? new Decimal(editor.form.liquidity.amount || 0).toNumber()
        : 0,
    )
    .plus(ztgTransactionFee ?? 0);

  const baseCurrencyMetadata =
    editor.form.currency && getMetadataForCurrency(editor.form.currency);

  const baseAssetTransactionFee = assetsAreEqual(
    baseCurrencyMetadata?.assetId,
    feeDetails?.assetId,
  )
    ? feeDetails?.amount
    : new Decimal(0);

  const foreignCurrencyCost =
    editor.form.liquidity?.deploy && editor.form.currency !== "ZTG"
      ? new Decimal(editor.form.liquidity.amount || 0)
          .mul(2)
          .plus(baseAssetTransactionFee ?? 0)
      : null;

  const ztgBalanceDelta = ztgBalance?.div(ZTG).minus(ztgCost);
  const foreignAssetBalanceDelta =
    foreignCurrencyCost &&
    foreignAssetBalance?.div(ZTG).minus(foreignCurrencyCost);

  const hasEnoughLiquidty =
    ztgBalanceDelta?.gte(0) &&
    (!foreignCurrencyCost || foreignAssetBalanceDelta?.gte(0));

  const submit = async () => {
    if (creationParams && isFullSdk(sdk)) {
      setIsTransacting(true);

      try {
        notifications.pushNotification("Transacting...", {
          autoRemove: true,
          type: "Info",
          lifetime: 60,
        });

        // Step 1: Create the market
        const result = await sdk.model.markets.create(
          creationParams,
          IOForeignAssetId.is(feeDetails?.assetId)
            ? feeDetails?.assetId
            : undefined,
        );

        const marketCreationEvent = result.raw.events.find(
          (event) => event.event.index.toString() === "0x3903",
        );

        if (!marketCreationEvent) {
          throw new Error("Market creation event not found");
        }
        const marketData = marketCreationEvent.event.data[2] as any;
        const marketId = Number(marketData.marketId);

        notifications.pushNotification(
          "Market created! Now deploying combinatorial pool...",
          {
            autoRemove: true,
            type: "Info",
            lifetime: 60,
          },
        );

        // Step 2: Deploy combinatorial pool if liquidity is enabled
        const poolParams = prepareCombinatorialPoolParams(editor.form as any);
        if (poolParams && isRpcSdk(sdk)) {
          try {
            // For combinatorial pools, we need to specify this is a single market
            // The asset count is the number of outcomes
            const outcomeCount =
              editor.form.answers?.type === "scalar"
                ? 2
                : (editor.form.answers?.answers as any)?.length || 0;

            // Deploy the combinatorial pool
            const deployPoolTx = sdk.api.tx.neoSwaps.deployCombinatorialPool(
              outcomeCount,
              [marketId], // Single market for now, can be extended for multi-market combinations
              poolParams.amount,
              poolParams.spotPrices,
              poolParams.swapFee,
              { total: 16, consumeAll: true }, // Default fuel
            );

            // Import the signAndSend utility function from lib/util/tx
            const { signAndSend } = await import("lib/util/tx");

            // Use the signer from creationParams
            const signer = creationParams.proxy || creationParams.signer;
            if (!signer) throw new Error("No active signer");

            // Use the utility function which handles signer types correctly
            await signAndSend(deployPoolTx, signer as any);

            notifications.pushNotification(
              "Combinatorial pool deployed successfully!",
              {
                autoRemove: true,
                type: "Success",
                lifetime: 10,
              },
            );
          } catch (poolError) {
            // Pool deployment failed, but market was created
            console.error("Pool deployment failed:", poolError);
            notifications.pushNotification(
              "Market created but pool deployment failed. You can deploy the pool later.",
              {
                autoRemove: true,
                type: "warning" as any,
                lifetime: 15,
              },
            );
          }
        }

        editor.published(marketId);

        notifications.pushNotification(
          "Market creation complete! Awaiting indexer.",
          {
            autoRemove: true,
            type: "Info",
            lifetime: 60,
          },
        );

        const indexedStatus = await poll(
          async () => {
            return checkMarketExists(
              sdk.indexer.client as unknown as GraphQLClient,
              marketId,
            );
          },
          {
            intervall: 1000,
            timeout: 6 * 1000,
          },
        );

        if (indexedStatus === PollingTimeout) {
          router.push(`/markets/await/${marketId}`);
        } else {
          notifications.pushNotification(
            "Market has been created and indexed! Redirecting to market page.",
            {
              autoRemove: true,
              type: "Success",
              lifetime: 15,
            },
          );

          router.push(`/markets/${marketId}`);
        }

        setTimeout(() => {
          editor.reset();
        }, 2000);
      } catch (error) {
        let type: NotificationType = "Error";
        let errorMessage = "Unknown error occurred.";

        if (StorageError.is(error)) {
          errorMessage = error?.message ?? "Metadata storage failed.";
        }

        if (isArray(error?.docs)) {
          errorMessage = error.docs[0];
        }

        if (error?.message === "Cancelled") {
          type = "Info";
          errorMessage = "Transaction cancelled";
        }

        notifications.pushNotification(errorMessage, {
          autoRemove: true,
          type: type,
          lifetime: 15,
        });

        console.error(error);
      }

      setIsTransacting(false);
    }
  };

  return (
    <>
      <div className="">
        <div className="center mb-6 inline-block">
          <div className="center mb-2 w-full">
            <div className="relative">
              <div className="relative">
                <TransactionButton
                  type="button"
                  disabled={
                    !editor.isValid ||
                    isTransacting ||
                    editor.isPublished ||
                    !hasEnoughLiquidty
                  }
                  className={`
                 center !h-auto !w-72 !gap-2 rounded-full !px-7 !py-4 !text-xl font-normal transition-all
              `}
                  onClick={submit}
                >
                  <div className="flex-1">
                    {!hasEnoughLiquidty
                      ? "Insufficient Balance"
                      : isTransacting
                        ? "Transacting.."
                        : "Publish Market"}
                  </div>
                  <div className={`${isTransacting && "animate-ping"}`}>
                    <RiSendPlaneLine />
                  </div>
                </TransactionButton>
                <div className="absolute -bottom-8 left-[50%] translate-x-[-50%]">
                  <div
                    className={`w-40 cursor-pointer text-center text-sm font-semibold underline ${
                      hasEnoughLiquidty ? "text-sky-900" : "text-vermilion"
                    }`}
                    onClick={() => setTotalCostIsOpen(true)}
                  >
                    View Cost Breakdown
                  </div>
                  <Modal
                    open={totalCostIsOpen}
                    onClose={() => setTotalCostIsOpen(false)}
                  >
                    <Dialog.Panel className="rounded-lg border border-sky-200/30 bg-white/95 p-8 shadow-xl backdrop-blur-lg">
                      <h2 className="mb-4 text-lg text-sky-900">
                        Cost Breakdown
                      </h2>
                      <div className="mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-sky-900">
                            {editor.form.moderation} Bond
                          </h3>
                          <div className="flex items-center justify-start gap-6">
                            <h4 className="flex-1 text-sm text-sky-900">
                              {editor.form.moderation === "Permissionless"
                                ? "Returned if the market isn't deleted by the committee."
                                : "Returned if the market is approved or ends before being approved by the committee."}
                            </h4>
                            <div className="flex self-end ">{bondCost} ZTG</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 flex">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-sky-900">
                            Oracle Bond
                          </h3>
                          <div className="flex items-center justify-start gap-6">
                            <h4 className="flex-1 text-sm text-sky-900">
                              Returned if oracle reports the market outcome on
                              time.
                            </h4>
                            <div className="">{oracleBond} ZTG</div>
                          </div>
                        </div>
                      </div>

                      {editor.form.moderation === "Permissionless" &&
                        editor.form.liquidity?.deploy && (
                          <div className="mb-4 mt-4 flex">
                            <div className="flex-1">
                              <h3 className="text-base font-normal text-sky-900">
                                Liquidity
                              </h3>
                              <div className="flex items-center justify-start gap-6">
                                <h4 className="flex-1 text-sm text-sky-900">
                                  Can be withdrawn at any time, will collect
                                  fees but subject to impermanent loss.
                                </h4>
                                <div className="">
                                  {new Decimal(
                                    editor.form.liquidity.amount || 0,
                                  ).toFixed(1)}{" "}
                                  {editor.form.currency}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="flex">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-sky-900">
                            Transaction Fee
                          </h3>
                          <div className="flex items-center justify-start gap-6">
                            <h4 className="flex-1 text-sm text-sky-900">
                              Returned if oracle reports the market outcome on
                              time.
                            </h4>
                            <div>
                              {formatNumberCompact(
                                feeDetails?.amount.toNumber() ?? 0,
                              )}{" "}
                              {feeDetails?.symbol}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4 mt-8 flex border-t-1 border-sky-200/30 pt-4">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-sky-900">
                            Total
                          </h3>
                          <div className="flex justify-start gap-6">
                            <h4 className="flex-1 text-sm text-sky-900">
                              Total cost for creating the market.
                            </h4>
                            <div className="center gap-1 font-semibold">
                              <div className="text-sky-900">
                                {ztgCost.toFixed(3)} ZTG
                              </div>
                              {foreignCurrencyCost && (
                                <>
                                  <div> + </div>
                                  <div
                                    className={`text-${baseCurrencyMetadata?.twColor}`}
                                  >
                                    {foreignCurrencyCost.toNumber()}{" "}
                                    {editor.form.currency}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {!hasEnoughLiquidty && (
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-red-400">
                            Insufficient Balance
                          </h3>
                          <div className="flex justify-start gap-6">
                            <h4 className="flex-1 text-sm text-sky-900">
                              Missing balance needed to create the market.
                            </h4>
                            <div className="center gap-1 font-semibold">
                              {ztgBalanceDelta &&
                                ztgBalanceDelta.lessThan(0) && (
                                  <div className="text-sky-900">
                                    {ztgBalanceDelta.toFixed(1)} ZTG
                                  </div>
                                )}
                            </div>
                            {foreignCurrencyCost &&
                              foreignAssetBalanceDelta?.lessThan(0) && (
                                <>
                                  <div
                                    className={`text-${baseCurrencyMetadata?.twColor}`}
                                  >
                                    {foreignAssetBalanceDelta.toNumber()}{" "}
                                    {editor.form.currency}
                                  </div>
                                </>
                              )}
                          </div>
                        </div>
                      )}
                    </Dialog.Panel>
                  </Modal>
                </div>
              </div>

              {editor.isWizard && (
                <div className="mt-14 flex justify-center md:mt-0">
                  <button
                    className={`
                    left-0 top-[50%] rounded-full border-2 px-6 py-2 text-sm backdrop-blur-md
                    duration-200 ease-in-out active:scale-95 md:absolute md:translate-x-[-110%] md:translate-y-[-50%]
                    ${
                      firstInvalidStep
                        ? "border-orange-300 bg-orange-50/80 text-orange-500"
                        : "border-sky-200/30 bg-white/80 text-sky-900"
                    }
                  `}
                    onClick={() => {
                      editor.goToSection(
                        firstInvalidStep?.label ?? "Liquidity",
                      );
                      window.scrollTo(0, 0);
                    }}
                    type="button"
                  >
                    {firstInvalidStep ? (
                      <div className="center gap-2">
                        {" "}
                        <LuFileWarning /> {`Fix ${firstInvalidStep?.label}`}
                      </div>
                    ) : (
                      "Go Back"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
