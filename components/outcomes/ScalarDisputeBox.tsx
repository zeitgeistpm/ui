import {
  getScalarBounds,
  IndexerContext,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk-next";
import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const ScalarDisputeBox = observer(
  ({
    market,
    onDispute,
  }: {
    market: Market<IndexerContext>;
    onDispute?: () => void;
  }) => {
    const [sdk] = useSdkv2();
    const store = useStore();
    const notificationStore = useNotificationStore();
    const [scalarReportValue, setScalarReportValue] = useState("");

    //TODO: move to react query
    const disputeBond = store.config.markets.disputeBond;
    const disputeFactor = store.config.markets.disputeFactor;
    const tokenSymbol = store.config.tokenSymbol;

    const { data: disputes } = useMarketDisputes(market);
    const lastDispute = disputes?.[disputes.length - 1];

    const signer = store?.wallets?.getActiveSigner();

    const bondAmount = disputes
      ? disputeBond + disputes.length * disputeFactor
      : disputeBond;

    const bounds = getScalarBounds(market).unwrap();

    const handleSignTransaction = async () => {
      if (!isRpcSdk(sdk)) return;
      const outcomeReport = {
        Scalar: Number(scalarReportValue),
      };

      const callback = extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification("Outcome Disputed", {
            type: "Success",
          });
          onDispute?.();
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

      const tx = sdk.context.api.tx.predictionMarkets.dispute(
        market.marketId,
        outcomeReport,
      );
      await signAndSend(tx, signer, callback);
    };

    return (
      <>
        <div className=" text-ztg-10-150 mb-ztg-5">
          Bond will start at {disputeBond} {tokenSymbol}, increasing by{" "}
          {disputeFactor} {tokenSymbol} for each dispute
        </div>
        <AmountInput
          value={scalarReportValue}
          min={bounds?.[0].toString()}
          max={bounds?.[1].toString()}
          onChange={(val) => setScalarReportValue(val)}
          showErrorMessage={false}
        />
        <div className="my-ztg-10">
          <div className=" h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600">
            <span>Previous Report:</span>
            <span className="font-mono">
              {lastDispute?.outcome.asScalar.toString() ??
                market.report.outcome.scalar}
            </span>
          </div>
          {bondAmount !== disputeBond && bondAmount !== undefined ? (
            <div className=" h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600 ">
              <span>Previous Bond:</span>
              <span className="font-mono">{bondAmount - disputeFactor}</span>
            </div>
          ) : (
            <></>
          )}
        </div>

        <TransactionButton
          className="my-ztg-10 shadow-ztg-2"
          onClick={handleSignTransaction}
        >
          Dispute Outcome
        </TransactionButton>
      </>
    );
  },
);

export default ScalarDisputeBox;
