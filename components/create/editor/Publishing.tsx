import { PollingTimeout, poll } from "@zeitgeistpm/avatara-util";
import { isFullSdk } from "@zeitgeistpm/sdk-next";
import { StorageError } from "@zeitgeistpm/web3.storage";
import { checkMarketExists } from "lib/gql/markets";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useChainTime } from "lib/state/chaintime";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import { marketFormDataToExtrinsicParams } from "lib/state/market-creation/types/form";
import { NotificationType, useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { isArray } from "lodash-es";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
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
          "Transaction succesfull! Awaiting indexer.",
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

  return (
    <>
      <div className="">
        <div className="mb-2 center w-full">
          <div className="relative">
            {editor.isWizard && (
              <button
                className={`
                    absolute left-0 top-[50%] translate-x-[-110%] translate-y-[-50%] border-gray-100 text-sm border-2 
                    rounded-full py-2 px-6 ease-in-out active:scale-95 duration-200
                    ${
                      firstInvalidStep &&
                      "bg-orange-300 border-orange-400 text-white"
                    }
                  `}
                onClick={() => {
                  editor.goToSection(firstInvalidStep?.label ?? "Liquidity");
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
            )}

            <button
              type="button"
              disabled={!editor.isValid || isTransacting || editor.isPublished}
              className={`
                 bg-gray-100 text-gray-400 py-4 px-6 rounded-full text-xl center gap-2 transition-all opacity-70 w-60
                ${
                  editor.isValid &&
                  !isTransacting &&
                  !editor.isPublished &&
                  "active:scale-95 !opacity-100 bg-ztg-blue text-white"
                }
              `}
              onClick={submit}
            >
              <div className="flex-1">
                {isTransacting ? "Transacting.." : "Publish Market"}
              </div>
              <div className={`${isTransacting && "animate-ping"}`}>
                <RiSendPlaneLine />
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
