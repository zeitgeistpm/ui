import {
  getScalarBounds,
  IndexerContext,
  isRpcSdk,
  Market,
  ScalarRangeType,
} from "@zeitgeistpm/sdk-next";
import Input from "components/ui/Input";
import { DateTimeInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { MarketScalarOutcome } from "lib/types";
import { useState } from "react";

const ScalarReportBox = ({
  market,
  onReport,
}: {
  market: Market<IndexerContext>;
  onReport?: (outcome: MarketScalarOutcome & { type: ScalarRangeType }) => void;
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

  const { send, isLoading, isBroadcasting, isSuccess } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      const outcomeReport: any = {
        scalar: new Decimal(scalarReportValue).mul(ZTG).toFixed(0),
      };

      return sdk.api.tx.predictionMarkets.report(
        market.marketId,
        outcomeReport,
      );
    },
    {
      onBroadcast: () => {},
      onSuccess: () => {
        if (onReport) {
          onReport?.({
            type: market.scalarType as ScalarRangeType,
            scalar: new Decimal(scalarReportValue).mul(ZTG).toFixed(0),
          });
        } else {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
        }
      },
    },
  );

  const reportDisabled =
    !sdk ||
    !isRpcSdk(sdk) ||
    isLoading ||
    isSuccess ||
    scalarReportValue === "";

  const handleSignTransaction = async () => send();

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
        <Input
          type="number"
          value={scalarReportValue}
          onChange={(e) => handleNumberChange(e.target.value)}
          min={bounds[0].toString()}
          max={bounds[1].toString()}
          className="text-ztg-14-150 p-2 w-full outline-none text-right font-mono mt-2"
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
        className="mt-4 shadow-ztg-2"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
        loading={isBroadcasting}
      >
        Report Outcome {scalarReportValue}
      </TransactionButton>
    </>
  );
};

export default ScalarReportBox;
