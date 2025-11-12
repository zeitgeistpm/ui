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
import { useState, useMemo } from "react";
import { LuFileWarning } from "react-icons/lu";
import { RiSendPlaneLine } from "react-icons/ri";
import { GraphQLClient } from "graphql-request";
import { minBaseLiquidity } from "lib/state/market-creation/constants/currency";

export type PublishingProps = {
  editor: MarketDraftEditor;
  creationParams?: CreateMarketParams<RpcContext>;
  compact?: boolean;
};

export const Publishing = ({
  editor,
  creationParams,
  compact = false,
}: PublishingProps) => {
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

  // Calculate liquidity cost: use minimum if deploying permissionless market with ZTG
  // and amount is below minimum or empty
  const liquidityAmount = useMemo(() => {
    if (
      editor.form.moderation === "Permissionless" &&
      editor.form.liquidity?.deploy &&
      editor.form.currency === "ZTG"
    ) {
      const enteredAmount = new Decimal(editor.form.liquidity.amount || 0).toNumber();
      const minimum = minBaseLiquidity[editor.form.currency] ?? 0;
      // Use minimum if amount is 0, empty, or below minimum
      return Math.max(enteredAmount, minimum);
    }
    return 0;
  }, [
    editor.form.moderation,
    editor.form.liquidity?.deploy,
    editor.form.liquidity?.amount,
    editor.form.currency,
  ]);

  const ztgCost = new Decimal(bondCost ?? 0)
    .plus(oracleBond ?? 0)
    .plus(liquidityAmount)
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
      ? new Decimal(editor.form.liquidity.amount || 0).plus(
          baseAssetTransactionFee ?? 0,
        )
      : null;

  const ztgBalanceDelta = ztgBalance?.div(ZTG).minus(ztgCost);
  const foreignAssetBalanceDelta =
    foreignCurrencyCost &&
    foreignAssetBalance?.div(ZTG).minus(foreignCurrencyCost);

  const hasEnoughLiquidty =
    ztgBalanceDelta?.gte(0) &&
    (!foreignCurrencyCost || foreignAssetBalanceDelta?.gte(0));

  // Only show breakdown if we have costs in different currencies
  const currency = editor.form.currency?.toUpperCase().trim();
  const isZtgCurrency = currency === "ZTG" || !currency;
  const shouldShowBreakdown =
    foreignCurrencyCost &&
    foreignCurrencyCost.gt(0) &&
    !isZtgCurrency &&
    !IOZtgAssetId.is(feeDetails?.assetId);

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
          "Market created! Waiting before deploying pool...",
          {
            autoRemove: true,
            type: "Info",
            lifetime: 60,
          },
        );

        // Step 2: Wait 6 seconds before deploying pool (allows chain to process market creation)
        await new Promise((resolve) => setTimeout(resolve, 6000));

        notifications.pushNotification("Deploying combinatorial pool...", {
          autoRemove: true,
          type: "Info",
          lifetime: 60,
        });

        // Step 3: Deploy combinatorial pool if liquidity is enabled
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
      <div
        className={`rounded-lg backdrop-blur-sm ${compact ? "bg-white/5 p-4" : "bg-white/10 p-6 md:p-8"}`}
      >
        {!compact && (
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-white/90 md:text-xl">
              Ready to Publish
            </h2>
            <p className="text-sm text-white/70">
              Review your market details below. All costs are shown in the
              bottom bar.
            </p>
          </div>
        )}

        <div
          className={`flex flex-col ${compact ? "items-stretch" : "items-center"}`}
        >
          {/* Publish Button */}
          <div className="relative w-full">
            <TransactionButton
              type="button"
              disabled={
                !editor.isValid ||
                isTransacting ||
                editor.isPublished ||
                !hasEnoughLiquidty
              }
              className={`
                !h-auto !w-full !gap-3 rounded-lg font-semibold transition-all
                ${
                  compact
                    ? "!px-6 !py-3 !text-base"
                    : "!max-w-md !px-8 !py-4 !text-lg md:!px-10 md:!py-5 md:!text-xl"
                }
                ${
                  !hasEnoughLiquidty || !editor.isValid
                    ? "!cursor-not-allowed !opacity-60"
                    : "hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
              onClick={submit}
            >
              <div className="flex-1">
                {!hasEnoughLiquidty
                  ? "Insufficient Balance"
                  : !editor.isValid
                    ? "Complete Required Fields"
                    : isTransacting
                      ? "Publishing Market..."
                      : "Publish Market"}
              </div>
              <div className={`${isTransacting && "animate-pulse"}`}>
                <RiSendPlaneLine size={compact ? 18 : 20} />
              </div>
            </TransactionButton>
          </div>

          {/* Go Back / Fix Errors Button */}
          {firstInvalidStep && (
            <button
              className={`flex items-center justify-center gap-2 rounded-lg border-2 border-orange-500/60 bg-orange-500/10 font-semibold text-orange-400 backdrop-blur-sm transition-all hover:border-orange-500/80 hover:bg-orange-500/20 active:scale-95 ${
                compact ? "mt-3 px-4 py-2 text-xs" : "mt-6 px-5 py-2.5 text-sm"
              }`}
              onClick={() => {
                editor.goToSection(firstInvalidStep.label);
                window.scrollTo(0, 0);
              }}
              type="button"
            >
              <LuFileWarning size={compact ? 14 : 16} />
              Fix {firstInvalidStep.label}
            </button>
          )}
        </div>

        {/* Cost Breakdown Modal */}
        <Modal open={totalCostIsOpen} onClose={() => setTotalCostIsOpen(false)}>
          <Dialog.Panel className="rounded-lg bg-ztg-primary-700/95 p-8 shadow-xl backdrop-blur-lg">
            <h2 className="mb-4 text-lg text-ztg-primary-100">
              Cost Breakdown
            </h2>
            <div className="mb-4">
              <div className="flex-1">
                <h3 className="text-base font-normal text-ztg-primary-100">
                  {editor.form.moderation} Bond
                </h3>
                <div className="flex items-center justify-start gap-6">
                  <h4 className="flex-1 text-sm text-ztg-primary-100">
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
                <h3 className="text-base font-normal text-ztg-primary-100">
                  Oracle Bond
                </h3>
                <div className="flex items-center justify-start gap-6">
                  <h4 className="flex-1 text-sm text-ztg-primary-100">
                    Returned if oracle reports the market outcome on time.
                  </h4>
                  <div className="">{oracleBond} ZTG</div>
                </div>
              </div>
            </div>

            {editor.form.moderation === "Permissionless" &&
              editor.form.liquidity?.deploy && (
                <div className="mb-4 mt-4 flex">
                  <div className="flex-1">
                    <h3 className="text-base font-normal text-ztg-primary-100">
                      Liquidity
                    </h3>
                    <div className="flex items-center justify-start gap-6">
                      <h4 className="flex-1 text-sm text-ztg-primary-100">
                        Can be withdrawn at any time, will collect fees but
                        subject to impermanent loss.
                      </h4>
                      <div className="">
                        {new Decimal(editor.form.liquidity.amount || 0).toFixed(
                          1,
                        )}{" "}
                        {editor.form.currency}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div className="flex">
              <div className="flex-1">
                <h3 className="text-base font-normal text-ztg-primary-100">
                  Transaction Fee
                </h3>
                <div className="flex items-center justify-start gap-6">
                  <h4 className="flex-1 text-sm text-ztg-primary-100">
                    Returned if oracle reports the market outcome on time.
                  </h4>
                  <div>
                    {formatNumberCompact(feeDetails?.amount.toNumber() ?? 0)}{" "}
                    {feeDetails?.symbol}
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4 mt-8 flex border-t-1 border-ztg-primary-200/30 pt-4">
              <div className="flex-1">
                <h3 className="text-base font-normal text-ztg-primary-100">
                  Total
                </h3>
                <div className="flex justify-start gap-6">
                  <h4 className="flex-1 text-sm text-ztg-primary-100">
                    Total cost for creating the market.
                  </h4>
                  <div className="center gap-1 font-semibold">
                    {shouldShowBreakdown ? (
                      <>
                        <div className="text-ztg-primary-100">
                          {ztgCost.toFixed(3)} ZTG
                        </div>
                        <div> + </div>
                        <div
                          className={`text-${baseCurrencyMetadata?.twColor}`}
                        >
                          {foreignCurrencyCost.toNumber().toFixed(1)}{" "}
                          {editor.form.currency}
                        </div>
                      </>
                    ) : (
                      <div className="text-ztg-primary-100">
                        {ztgCost.toFixed(3)} ZTG
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {!hasEnoughLiquidty && (
              <div className="flex-1">
                <h3 className="text-base font-normal text-ztg-red-400">
                  Insufficient Balance
                </h3>
                <div className="flex justify-start gap-6">
                  <h4 className="flex-1 text-sm text-ztg-primary-100">
                    Missing balance needed to create the market.
                  </h4>
                  <div className="center gap-1 font-semibold">
                    {ztgBalanceDelta && ztgBalanceDelta.lessThan(0) && (
                      <div className="text-ztg-primary-100">
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
    </>
  );
};
