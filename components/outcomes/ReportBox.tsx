import { observer } from "mobx-react";
import { Skeleton } from "@material-ui/lab";
import { combineLatestWith, from } from "rxjs";
import React, { useState, useEffect } from "react";

import { OutcomeOption } from "lib/stores/ExchangeStore";
import { useStore } from "lib/stores/Store";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import MarketStore from "lib/stores/MarketStore";

import TransactionButton from "components/ui/TransactionButton";
import AssetSelectView from "components/assets/AssetSelectView";
import AssetSelectButton from "components/assets/AssetSelectButton";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useMarket } from "lib/hooks/queries/useMarket";
import ScalarReportBox from "./ScalarReportBox";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";

const ReportBox = observer(
  ({
    marketStore,
    onReport,
  }: {
    marketStore: MarketStore;
    onReport: () => void;
  }) => {
    const store = useStore();
    const [sdk] = useSdkv2();
    const { wallets } = store;
    const [isSelectView, setIsSelectView] = useState(false);
    const [selectedAssetOption, setSelectedAssetOption] =
      useState<OutcomeOption>();
    const [options, setOptions] = useState<OutcomeOption[]>();

    const { data: marketsdkv2 } = useMarket(marketStore?.market?.marketId);

    const getOptions = async (): Promise<OutcomeOption[]> => {
      const outcomes = marketStore.marketOutcomes.filter(
        (o) => o.metadata !== "ztg",
      );

      let options: OutcomeOption[] = [];

      for (const outcome of outcomes) {
        const balance = await store.getBalance(outcome.asset);
        options.push({
          value: JSON.stringify(outcome.asset),
          label: outcome.metadata["ticker"],
          color: outcome.metadata["color"],
          marketId: marketStore.id,
          marketSlug: marketStore.slug,
          balance: balance?.toFixed(4),
        });
      }

      return options;
    };

    const notificationStore = useNotificationStore();

    const reportDisabled = !marketStore.connectedWalletCanReport;

    useEffect(() => {
      const obs = marketStore.marketChange$.pipe(
        combineLatestWith(from(getOptions())),
      );
      const sub = obs.subscribe(
        ([_, options]: [_: number, options: OutcomeOption[]]) => {
          setOptions(options);
          const outcomeidx = options.findIndex(
            (o) => o.value === selectedAssetOption?.value,
          );
          if (selectedAssetOption == null) {
            if (outcomeidx !== -1) {
              setSelectedAssetOption(options[outcomeidx]);
            } else {
              setSelectedAssetOption(options[0]);
            }
          }
        },
      );
      return () => sub.unsubscribe();
    }, [wallets.activeAccount, selectedAssetOption]);

    useEffect(() => {
      if (selectedAssetOption == null) {
        return;
      }
      const sub = from(getOptions()).subscribe(setOptions);
      return () => sub.unsubscribe();
    }, [selectedAssetOption]);

    const handleSignTransaction = async () => {
      const outcomeReport: any = {
        Categorical: JSON.parse(selectedAssetOption.value)
          .categoricalOutcome[1],
      };

      const signer = store.wallets.getActiveSigner();
      const { market } = marketStore;

      const callback = extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
          await marketStore.refetchMarketData();
          onReport();
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            {
              type: "Error",
            },
          );
        },
      });

      if (isRpcSdk(sdk)) {
        const tx = sdk.context.api.tx.predictionMarkets.report(
          market.marketId,
          outcomeReport,
        );
        signAndSend(tx, signer, callback);
      }
    };

    return (
      <div className="py-ztg-10 rounded-ztg-10 text-sky-600 bg-white dark:bg-sky-1000">
        {options == null ? (
          <Skeleton
            className="!py-ztg-10 !rounded-ztg-10 !transform-none"
            height={147}
          />
        ) : (
          <>
            <div className="flex items-center px-ztg-16">
              <div className=" font-bold text-ztg-14-150 h-ztg-25">
                Report outcome
              </div>
            </div>
            <>
              {marketStore.type === "categorical" && (
                <>
                  {isSelectView === false ? (
                    <div className="px-ztg-16">
                      <AssetSelectButton
                        selection={selectedAssetOption}
                        onClick={() => {
                          setIsSelectView(true);
                        }}
                        balance={selectedAssetOption?.balance ?? ""}
                      />
                      <TransactionButton
                        className="mb-ztg-10 shadow-ztg-2"
                        onClick={handleSignTransaction}
                        disabled={reportDisabled}
                      >
                        Report Outcome
                      </TransactionButton>
                    </div>
                  ) : (
                    <AssetSelectView
                      onBack={() => setIsSelectView(false)}
                      options={options}
                      selectedOption={selectedAssetOption}
                      onOptionChange={(opt) => {
                        setSelectedAssetOption(opt);
                      }}
                    />
                  )}
                </>
              )}
              {marketsdkv2?.marketType.scalar && (
                <div className="px-ztg-16">
                  <ScalarReportBox market={marketsdkv2} onReport={onReport} />
                </div>
              )}
            </>
          </>
        )}
      </div>
    );
  },
);

export default ReportBox;
