import {
  getScalarBounds,
  IndexerContext,
  isNA,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk-next";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import { useAuthorityProxiesForMarket } from "lib/hooks/queries/useAuthorityProxiesForMarket";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const ScalarReportBox = observer(
  ({
    market,
    onReport,
  }: {
    market: Market<IndexerContext>;
    onReport?: () => void;
  }) => {
    const [sdk] = useSdkv2();
    const store = useStore();
    const { wallets } = store;
    const notificationStore = useNotificationStore();
    const [scalarReportValue, setScalarReportValue] = useState("");

    const signer = wallets?.getActiveSigner();
    const { data: authorityProxies } = useAuthorityProxiesForMarket(market);

    if (!market) return null;

    const bounds = getScalarBounds(market).unwrap();

    const handleNumberChange = (val: string) => {
      setScalarReportValue(val);
    };

    const reportDisabled = !sdk || !isRpcSdk(sdk);

    const isAuthorityProxy =
      !isNA(authorityProxies) && authorityProxies.includes(signer?.address);

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
      } else if (isRpcSdk(sdk)) {
        const tx = sdk.context.api.tx.predictionMarkets.report(
          market.marketId,
          outcomeReport,
        );
        signAndSend(tx, signer, callback);
      }
    };

    return (
      <>
        <AmountInput
          value={scalarReportValue}
          min={bounds[0].toString()}
          max={bounds[1].toString()}
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
