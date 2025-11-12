import {
  IndexerContext,
  Market,
  ScalarRangeType,
  getScalarBounds,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import Input from "components/ui/Input";
import TransactionButton from "components/ui/TransactionButton";
import { DateTimeInput } from "components/ui/inputs";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { MarketScalarOutcome } from "lib/types";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { useState } from "react";

const ScalarReportBox = ({
  market,
  onReport,
}: {
  market: Market<IndexerContext>;
  onReport?: (outcome: MarketScalarOutcome & { type: ScalarRangeType }) => void;
}) => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();

  const [expandedInfoToggled, setExpandedInfoToggled] = useState(false);

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
      if (!isRpcSdk(sdk) || scalarReportValue === "") return;

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
            scalar: new Decimal(scalarReportValue).mul(ZTG).toString(),
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

  const digits =
    bounds[0].abs().toString().length + bounds[1].abs().toString().length;

  const hasExpandedInfo =
    bounds[0].abs().gte(1000) || bounds[1].abs().gte(1000);

  return (
    <>
      {isScalarDate ? (
        <div className="relative z-50">
          <DateTimeInput
            timestamp={scalarReportValue}
            onChange={setScalarReportValue}
            isValidDate={(current) => {
              const loBound = bounds[0].toNumber();
              const hiBound = bounds[1].toNumber();
              if (
                current.valueOf() >= loBound &&
                current.valueOf() <= hiBound
              ) {
                return true;
              }
              return false;
            }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-ztg-primary-200/30 bg-ztg-primary-900/50 shadow-md backdrop-blur-md sm:flex md:block lg:flex">
          <Input
            type="number"
            value={scalarReportValue}
            onChange={(e) => handleNumberChange(e.target.value)}
            min={bounds[0].toString()}
            max={bounds[1].toString()}
            className="w-full !rounded-none border-0 bg-transparent p-2 text-right font-mono text-ztg-14-150 text-white/90 outline-none focus:bg-transparent focus:ring-0 focus:ring-offset-0"
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

          <div
            className={`focus:outline-none ${
              hasExpandedInfo && "cursor-pointer"
            }`}
            title={
              hasExpandedInfo
                ? "Click to show full scalar range of market."
                : ""
            }
            onClick={() =>
              hasExpandedInfo && setExpandedInfoToggled(!expandedInfoToggled)
            }
          >
            <div
              className={`flex h-full flex-1 items-center justify-end border-l border-ztg-green-500/40 bg-ztg-primary-800/40 px-3 py-1 text-sm text-white/90 shadow-sm backdrop-blur-sm transition-all ease-[cubic-bezier(0.95,0.05,0.795,0.035)] sm:justify-center md:justify-end lg:justify-center ${hasExpandedInfo ? "hover:bg-ztg-primary-700/40" : ""}`}
              style={{
                minWidth: expandedInfoToggled ? digits * 18 : digits * 12,
              }}
            >
              <div className="flex flex-1 self-start text-white/90 sm:hidden md:flex lg:hidden">
                Scalar range:
              </div>
              <div className="whitespace-nowrap">
                {new Intl.NumberFormat("en-US", {
                  maximumSignificantDigits: expandedInfoToggled ? 10 : 5,
                  compactDisplay: "short",
                  notation: expandedInfoToggled ? undefined : "compact",
                }).format(bounds[0].toNumber())}{" "}
                {"<-> "}{" "}
                {new Intl.NumberFormat("en-US", {
                  maximumSignificantDigits: expandedInfoToggled ? 10 : 5,
                  compactDisplay: "short",
                  notation: expandedInfoToggled ? undefined : "compact",
                }).format(bounds[1].toNumber())}
              </div>
            </div>
          </div>
        </div>
      )}
      <TransactionButton
        className="mt-4"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
        loading={isBroadcasting}
      >
        {scalarReportValue != null && scalarReportValue != "" && (
          <>Report Outcome</>
        )}
      </TransactionButton>
    </>
  );
};

export default ScalarReportBox;
