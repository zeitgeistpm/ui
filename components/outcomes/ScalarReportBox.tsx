import {
  CategoricalAssetId,
  getMarketIdOf,
  isRpcSdk,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import MarketStore from "lib/stores/MarketStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const ScalarReportBox = observer(
  ({
    assetId,
    onReport,
  }: {
    assetId: ScalarAssetId | CategoricalAssetId;
    onReport?: () => void;
  }) => {
    const [sdk] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const [scalarReportValue, setScalarReportValue] = useState("");

    const marketId = getMarketIdOf(assetId);
    const { data: market } = useMarket(marketId);

    if (!market) return null;

    const handleNumberChange = (val: string) => {
      setScalarReportValue(val);
    };

    const reportDisabled = !sdk || !isRpcSdk(sdk);

    const { isAuthorityProxy } = marketStore;

    const handleSignTransaction = async () => {
      const outcomeReport: any = {
        scalar: Number(scalarReportValue),
      };
      const signer = wallets.getActiveSigner();

      const callback = extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
          onReport?.();
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

      if (market.disputeMechanism.Authorized && market.status === "Disputed") {
        const tx = store.sdk.api.tx.authorized.authorizeMarketOutcome(
          market.marketId,
          outcomeReport,
        );
        if (isAuthorityProxy) {
          const proxyTx = store.sdk.api.tx.proxy.proxy(
            market.disputeMechanism.Authorized,
            "Any",
            tx,
          );
          signAndSend(proxyTx, signer, callback);
        } else {
          signAndSend(tx, signer, callback);
        }
      } else {
        await market.reportOutcome(signer, outcomeReport, callback);
      }
    };
    return (
      <>
        <AmountInput
          value={scalarReportValue}
          min={market.bounds?.[0].toString()}
          max={market.bounds?.[1].toString()}
          onChange={handleNumberChange}
          showErrorMessage={false}
        />
        <TransactionButton
          className="my-ztg-10 shadow-ztg-2"
          onClick={handleSignTransaction}
          disabled={reportDisabled}
        >
          Report Outcome
        </TransactionButton>
      </>
    );
  },
);

export default ScalarReportBox;
