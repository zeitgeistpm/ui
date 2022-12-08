import { observer } from "mobx-react";
import React, { useEffect, useMemo, useState } from "react";
import { combineLatestWith, from } from "rxjs";
import { OutcomeOption } from "lib/stores/ExchangeStore";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import TransactionButton from "../ui/TransactionButton";
import AssetSelectButton from "../assets/AssetSelectButton";
import AssetSelectView from "../assets/AssetSelectView";
import { AmountInput } from "../ui/inputs";
import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import ScalarDisputeBox from "./ScalarDisputeBox";

const DisputeBox = observer(
  ({
    marketStore,
    onDispute,
  }: {
    marketStore: MarketStore;
    onDispute: () => void;
  }) => {
    const [isSelectView, setIsSelectView] = useState(false);
    const [selectedAssetOption, setSelectedAssetOption] =
      useState<OutcomeOption>();
    const [options, setOptions] = useState<OutcomeOption[]>();
    const [bond, setBond] = useState<number>();

    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();

    const disputeBond = store.config.markets.disputeBond;
    const disputeFactor = store.config.markets.disputeFactor;
    const tokenSymbol = store.config.tokenSymbol;

    const getOptions = async (): Promise<OutcomeOption[]> => {
      let lastReportedOutcome =
        marketStore.lastDispute != null
          ? //@ts-ignore
            marketStore.lastDispute.outcome
          : //@ts-ignore
            marketStore.market.report.toJSON().outcome;

      const outcomes = marketStore.marketOutcomes.filter((o) => {
        const isZtg = o.metadata === "ztg";
        const isCategorical =
          o.asset != null && o.asset["categoricalOutcome"] != null;
        const isReported =
          isCategorical &&
          o.asset["categoricalOutcome"][1] ===
            lastReportedOutcome["categorical"];
        return !isZtg && !isReported;
      });

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

    const disputesNum = useMemo(() => {
      return marketStore?.disputes.length || 0;
    }, [marketStore?.disputes]);

    useEffect(() => {
      const obs = marketStore.marketChange$.pipe(
        combineLatestWith(from(getOptions())),
      );
      const sub = obs.subscribe(
        ([_, options]: [_: number, options: OutcomeOption[]]) => {
          setOptions(options);
        },
      );
      return () => sub.unsubscribe();
    }, []);

    useEffect(() => {
      if (options == null) {
        return;
      }
      if (selectedAssetOption == null) {
        setSelectedAssetOption(options[0]);
      }
    }, [options]);

    useEffect(() => {
      if (selectedAssetOption == null) {
        return;
      }
      const sub = from(getOptions()).subscribe(setOptions);
      return () => sub.unsubscribe();
    }, [selectedAssetOption]);

    useEffect(() => {
      if (selectedAssetOption == null) {
        return;
      }
      const sub = from(getOptions()).subscribe((options) => {
        setOptions(options);
        setSelectedAssetOption(options[0]);
      });
      return () => sub.unsubscribe();
    }, [bond]);

    useEffect(() => {
      if (marketStore == null) {
        return;
      }
      const { disputes } = marketStore;
      const bondAmount = disputes
        ? disputeBond + disputes.length * disputeFactor
        : disputeBond;
      setBond(bondAmount);
    }, [marketStore?.disputes]);

    const handleSignTransaction = async () => {
      const { market } = marketStore;
      const outcomeReport: OutcomeReport = {
        categorical: JSON.parse(selectedAssetOption.value)
          .categoricalOutcome[1],
      };

      const signer = wallets.getActiveSigner();
      await market.dispute(
        signer,
        outcomeReport,
        extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification("Outcome Disputed", {
              type: "Success",
            });
            await marketStore.refetchMarketData();
            onDispute();
          },
          failCallback: ({ index, error }) => {
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              {
                type: "Error",
              },
            );
          },
        }),
      );
    };

    const disputesDisabled = disputesNum >= store.config.markets.maxDisputes;

    return (
      <div className="py-ztg-10 rounded-ztg-10 text-sky-600 bg-white dark:bg-sky-1000">
        <div className="flex items-center px-ztg-16">
          <div className=" font-bold text-ztg-14-150 h-ztg-25">
            Dispute outcome
          </div>
        </div>

        {marketStore.type === "scalar" && (
          <div className="px-ztg-16">
            <ScalarDisputeBox marketStore={marketStore} onDispute={onDispute} />
          </div>
        )}

        {marketStore.type === "categorical" && (
          <>
            {isSelectView === false ? (
              <div className="px-ztg-16">
                <AssetSelectButton
                  selection={selectedAssetOption}
                  onClick={() => {
                    setIsSelectView(true);
                  }}
                />
                <div className=" text-ztg-10-150 mb-ztg-2">
                  Bond will start at {disputeBond} {tokenSymbol}, increasing by{" "}
                  {disputeFactor} {tokenSymbol} for each dispute
                </div>
                <div className="flex h-ztg-36 items-center mb-ztg-10">
                  <div className="w-ztg-108">
                    <div className="flex h-ztg-20">
                      <div className="w-ztg-20 h-ztg-20 border-2 border-sky-600 rounded-full mr-ztg-8 bg-ztg-blue"></div>
                      <div className=" text-base font-bold flex items-center text-black dark:text-white">
                        {tokenSymbol}
                      </div>
                    </div>
                  </div>
                  <div className="flex-grow text-right font-mono text-ztg-12-150 text-sky-600">
                    {wallets?.activeBalance.toFixed(3)}
                  </div>
                </div>
                <AmountInput
                  containerClass="dark:bg-sky-1000"
                  className="h-ztg-40 w-full rounded-ztg-5 text-gray-dark-3 bg-transparent text-right mb-ztg-10 !px-ztg-8 border-1 border-sky-200 dark:border-border-dark"
                  value={bond?.toString()}
                  disabled
                />
                {bond !== disputeBond && bond !== undefined ? (
                  <div className=" h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600 mb-ztg-10">
                    <span>Previous Bond:</span>
                    <span className="font-mono">{bond - disputeFactor}</span>
                  </div>
                ) : (
                  <></>
                )}
                <TransactionButton
                  className="mb-ztg-10 shadow-ztg-2"
                  onClick={handleSignTransaction}
                  disabled={disputesDisabled}
                >
                  Dispute Outcome
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
      </div>
    );
  },
);

export default DisputeBox;
