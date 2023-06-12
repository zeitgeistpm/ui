import { Dialog } from "@headlessui/react";
import { PollingTimeout, poll } from "@zeitgeistpm/avatara-util";
import { isFullSdk } from "@zeitgeistpm/sdk-next";
import { StorageError } from "@zeitgeistpm/web3.storage";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { checkMarketExists } from "lib/gql/markets";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useChainTime } from "lib/state/chaintime";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import { marketFormDataToExtrinsicParams } from "lib/state/market-creation/types/form";
import { NotificationType, useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { isArray } from "lodash-es";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { LuFileWarning } from "react-icons/lu";
import { RiSendPlaneLine } from "react-icons/ri";

export type PublishingProps = {
  editor: MarketDraftEditor;
};

export const Publishing = ({ editor }: PublishingProps) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const router = useRouter();
  const chainTime = useChainTime();
  const notifications = useNotifications();
  const [isTransacting, setIsTransacting] = useState(false);
  const [totalCostIsOpen, setTotalCostIsOpen] = useState(false);
  const { data: constants } = useChainConstants();

  const firstInvalidStep = editor.steps.find((step) => !step.isValid);

  const params = useMemo(() => {
    if (editor.isValid && chainTime) {
      return marketFormDataToExtrinsicParams(
        editor.form,
        wallet.getActiveSigner(),
        chainTime,
      );
    }
    return;
  }, [editor.form, chainTime, wallet.activeAccount]);

  const submit = async () => {
    if (params && isFullSdk(sdk)) {
      setIsTransacting(true);

      try {
        notifications.pushNotification("Transacting..", {
          autoRemove: true,
          type: "Info",
          lifetime: 20,
        });

        const result = await sdk.model.markets.create(params);
        const marketId = result.saturate().unwrap().market.marketId;

        editor.published(marketId);

        notifications.pushNotification(
          "Transaction successful! Awaiting indexer.",
          {
            autoRemove: true,
            type: "Info",
            lifetime: 20,
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
        console.error(error);
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
      }

      setIsTransacting(false);
    }
  };

  const baseAssetLiquidityRow = editor.form?.liquidity?.rows.find(
    (row) => row.asset === editor.form.currency,
  );

  const bondCost =
    editor.form.moderation === "Permissionless"
      ? constants?.markets.validityBond
      : constants?.markets.advisoryBond;

  const oracleBond = constants?.markets.oracleBond;

  const ztgCost = new Decimal(bondCost ?? 0)
    .plus(oracleBond ?? 0)
    .plus(
      editor.form.liquidity?.deploy && editor.form.currency === "ZTG"
        ? new Decimal(baseAssetLiquidityRow?.value).mul(2).toNumber()
        : 0,
    );

  const foreignCurrencyCost =
    editor.form.liquidity?.deploy && editor.form.currency !== "ZTG"
      ? new Decimal(baseAssetLiquidityRow?.value ?? 0).mul(2).toNumber()
      : null;

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
                    !editor.isValid || isTransacting || editor.isPublished
                  }
                  className={`
                 !py-4 !px-7 !h-auto rounded-full !text-xl center font-normal !gap-2 transition-all !w-60
              `}
                  onClick={submit}
                >
                  <div className="flex-1">
                    {isTransacting ? "Transacting.." : "Publish Market"}
                  </div>
                  <div className={`${isTransacting && "animate-ping"}`}>
                    <RiSendPlaneLine />
                  </div>
                </TransactionButton>
                <div className="absolute -bottom-8 left-[50%] translate-x-[-50%]">
                  <div
                    className="cursor-pointer text-ztg-blue text-sm underline font-semibold w-40 text-center"
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
                      <div className="flex">
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
                      {editor.form.liquidity?.deploy && (
                        <div className="mt-4 flex">
                          <div className="flex-1">
                            <h3 className="text-base font-normal text-black">
                              Liquidity
                            </h3>
                            <div className="flex justify-start items-center gap-6">
                              <h4 className="text-sm flex-1 text-gray-500 font-light">
                                Can be withdrawn at any time, will collect fees
                                but subject to impermanent loss.
                              </h4>
                              <div className="">
                                {new Decimal(baseAssetLiquidityRow?.value)
                                  .mul(2)
                                  .toFixed(1)}{" "}
                                {baseAssetLiquidityRow?.asset}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mt-8 flex border-t-1 pt-4">
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
                                {ztgCost.toFixed(1)} ZTG
                              </div>
                              {foreignCurrencyCost && (
                                <>
                                  <div> + </div>
                                  <div
                                    className={`text-${
                                      getMetadataForCurrency(
                                        editor.form.currency,
                                      )?.twColor
                                    }`}
                                  >
                                    {foreignCurrencyCost}{" "}
                                    {baseAssetLiquidityRow?.asset}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
