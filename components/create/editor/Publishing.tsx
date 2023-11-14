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
} from "@zeitgeistpm/sdk";
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
    [creationParams, wallet.activeAccount],
    async () => {
      if (!feesEnabled) {
        return new Decimal(0);
      }
      const paymentInfo = await sdk.model.markets.create.calculateFees(
        creationParams,
      );
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

  const baseAssetLiquidityRow = editor.form?.liquidity?.rows?.find(
    (row) => row.asset === editor.form.currency,
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
        ? new Decimal(baseAssetLiquidityRow?.value ?? 0).mul(2).toNumber()
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
      ? new Decimal(baseAssetLiquidityRow?.value ?? 0)
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

        const result = await sdk.model.markets.create(
          creationParams,
          IOForeignAssetId.is(feeDetails?.assetId)
            ? feeDetails?.assetId
            : undefined,
        );
        const marketId = result.saturate().unwrap().market.marketId;

        editor.published(marketId);

        notifications.pushNotification(
          "Transaction successful! Awaiting indexer.",
          {
            autoRemove: true,
            type: "Info",
            lifetime: 60,
          },
        );

        const indexedStatus = await poll(
          async () => {
            return checkMarketExists(sdk.indexer.client, marketId);
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
          errorMessage = "IPFS metadata upload failed.";
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
        <div className="inline-block mb-6 center">
          <div className="mb-2 center w-full">
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
                 !py-4 !px-7 !h-auto rounded-full !text-xl center font-normal !gap-2 transition-all !w-72
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
                    className={`cursor-pointer text-sm underline font-semibold w-40 text-center ${
                      hasEnoughLiquidty ? "text-ztg-blue" : "text-vermilion"
                    }`}
                    onClick={() => setTotalCostIsOpen(true)}
                  >
                    View Cost Breakdown
                  </div>
                  <Modal
                    open={totalCostIsOpen}
                    onClose={() => setTotalCostIsOpen(false)}
                  >
                    <Dialog.Panel className="bg-white rounded-md p-8">
                      <h2 className="text-lg mb-4">Cost Breakdown</h2>
                      <div className="mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-black">
                            {editor.form.moderation} Bond
                          </h3>
                          <div className="flex justify-start items-center gap-6">
                            <h4 className="text-sm flex-1 text-gray-500 font-light">
                              {editor.form.moderation === "Permissionless"
                                ? "Returned if the market isn't deleted by the committee."
                                : "Returned if the market is approved or ends before being approved by the committee."}
                            </h4>
                            <div className="flex self-end ">{bondCost} ZTG</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-black">
                            Oracle Bond
                          </h3>
                          <div className="flex justify-start items-center gap-6">
                            <h4 className="text-sm flex-1 text-gray-500 font-light">
                              Returned if oracle reports the market outcome on
                              time.
                            </h4>
                            <div className="">{oracleBond} ZTG</div>
                          </div>
                        </div>
                      </div>

                      {editor.form.moderation === "Permissionless" &&
                        editor.form.liquidity?.deploy &&
                        baseAssetLiquidityRow && (
                          <div className="mt-4 mb-4 flex">
                            <div className="flex-1">
                              <h3 className="text-base font-normal text-black">
                                Liquidity
                              </h3>
                              <div className="flex justify-start items-center gap-6">
                                <h4 className="text-sm flex-1 text-gray-500 font-light">
                                  Can be withdrawn at any time, will collect
                                  fees but subject to impermanent loss.
                                </h4>
                                <div className="">
                                  {new Decimal(baseAssetLiquidityRow.value)
                                    .mul(2)
                                    .toFixed(1)}{" "}
                                  {baseAssetLiquidityRow?.asset}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="flex">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-black">
                            Transaction Fee
                          </h3>
                          <div className="flex justify-start items-center gap-6">
                            <h4 className="text-sm flex-1 text-gray-500 font-light">
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
                      <div className="mt-8 mb-4 flex border-t-1 pt-4">
                        <div className="flex-1">
                          <h3 className="text-base font-normal text-black">
                            Total
                          </h3>
                          <div className="flex justify-start gap-6">
                            <h4 className="text-sm flex-1 text-gray-500 font-light">
                              Total cost for creating the market.
                            </h4>
                            <div className="center font-semibold gap-1">
                              <div className="text-ztg-blue">
                                {ztgCost.toFixed(3)} ZTG
                              </div>
                              {foreignCurrencyCost && (
                                <>
                                  <div> + </div>
                                  <div
                                    className={`text-${baseCurrencyMetadata?.twColor}`}
                                  >
                                    {foreignCurrencyCost.toNumber()}{" "}
                                    {baseAssetLiquidityRow?.asset}
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
                            <h4 className="text-sm flex-1 font-light text-gray-500">
                              Missing balance needed to create the market.
                            </h4>
                            <div className="center font-semibold gap-1">
                              {ztgBalanceDelta &&
                                ztgBalanceDelta.lessThan(0) && (
                                  <div className="text-ztg-blue">
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
                                    {baseAssetLiquidityRow?.asset}
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
                <div className="mt-14 md:mt-0 flex justify-center">
                  <button
                    className={`
                    md:absolute left-0 top-[50%] md:translate-x-[-110%] md:translate-y-[-50%] border-gray-100 text-sm border-2 
                    rounded-full py-2 px-6 ease-in-out active:scale-95 duration-200
                    ${
                      firstInvalidStep &&
                      "bg-white border-orange-200 text-orange-500"
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
