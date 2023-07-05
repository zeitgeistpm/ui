import {
  getScalarBounds,
  IndexerContext,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk-next";
import { DateTimeInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";

const ScalarReportBox = ({
  market,
  onReport,
}: {
  market: Market<IndexerContext>;
  onReport?: () => void;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();

  if (!market) return null;

  const bounds = getScalarBounds(market).unwrap();

  const handleNumberChange = (val: string) => {
    setScalarReportValue(val);
  };

  const isScalarDate = market.scalarType === "date";

  const [scalarReportValue, setScalarReportValue] = useState(() => {
    return ((bounds[1].toNumber() + bounds[0].toNumber()) / 2).toFixed(0);
  });

  const reportDisabled = !sdk || !isRpcSdk(sdk) || scalarReportValue === "";

  const handleSignTransaction = async () => {
    const outcomeReport: any = {
      scalar: new Decimal(scalarReportValue).mul(ZTG).toFixed(0),
    };

    const signer = wallet.getSigner();

    if (isRpcSdk(sdk) && signer) {
      const tx = sdk.api.tx.predictionMarkets.report(
        market.marketId,
        outcomeReport,
      );

      const callback = extrinsicCallback({
        api: sdk.api,
        notifications: notificationStore,
        successCallback: async () => {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
          onReport?.();
        },
        failCallback: (error) => {
          notificationStore.pushNotification(error, {
            type: "Error",
          });
        },
      });

      signAndSend(tx, signer, callback);
    }
  };

  return (
    <>
      {isScalarDate ? (
        <DateTimeInput
          timestamp={scalarReportValue}
          onChange={setScalarReportValue}
          isValidDate={(current) => {
            const loBound = bounds[0].toNumber();
            const hiBound = bounds[1].toNumber();
            if (current.valueOf() >= loBound && current.valueOf() <= hiBound) {
              return true;
            }
            return false;
          }}
        />
      ) : (
        <input
          type="number"
          value={scalarReportValue}
          onChange={(e) => handleNumberChange(e.target.value)}
          min={bounds[0].toString()}
          max={bounds[1].toString()}
          className="text-ztg-14-150 p-2 bg-sky-200 rounded-md w-full outline-none text-right font-mono mt-2"
          onBlur={() => {
            if (
              scalarReportValue === "" ||
              Number(scalarReportValue) < bounds[0].toNumber()
            ) {
              setScalarReportValue(bounds[0].toString());
            } else if (Number(scalarReportValue) > bounds[1].toNumber()) {
              setScalarReportValue(bounds[1].toString());
            }
          }}
        />
      )}
      <TransactionButton
        className="my-ztg-10 shadow-ztg-2"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
      >
        Report Outcome
      </TransactionButton>
    </>
  );
};

export default ScalarReportBox;
