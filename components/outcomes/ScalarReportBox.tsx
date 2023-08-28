import { Popover, Transition } from "@headlessui/react";
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
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { Fragment, useState } from "react";

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
        <div className="bg-gray-50 overflow-hidden sm:flex md:block lg:flex rounded-md">
          <Input
            type="number"
            value={scalarReportValue}
            onChange={(e) => handleNumberChange(e.target.value)}
            min={bounds[0].toString()}
            max={bounds[1].toString()}
            className="text-ztg-14-150 p-2 w-full outline-none text-right font-mono !rounded-none "
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
              className={`flex justify-end sm:justify-center md:justify-end lg:justify-center items-center px-3 text-sm transition-all ease-[cubic-bezier(0.95,0.05,0.795,0.035)] flex-1 h-full py-1 bg-scalar-bar text-scalar-text`}
              style={{
                minWidth: expandedInfoToggled ? digits * 18 : digits * 12,
              }}
            >
              <div className="self-start flex sm:hidden md:flex flex-1 lg:hidden">
                Scalar range:
              </div>
              <div className="whitespace-nowrap">
                {expandedInfoToggled
                  ? bounds[0].toNumber()
                  : new Intl.NumberFormat("en-IN", {
                      maximumSignificantDigits: expandedInfoToggled ? 100 : 5,
                      compactDisplay: "short",
                      notation: "compact",
                    }).format(bounds[0].toNumber())}{" "}
                {"<-> "}{" "}
                {expandedInfoToggled
                  ? bounds[1].toNumber()
                  : new Intl.NumberFormat("en-IN", {
                      maximumSignificantDigits: 5,
                      compactDisplay: "short",
                      notation: "compact",
                    }).format(bounds[1].toNumber())}
              </div>
            </div>
          </div>
        </div>
      )}
      <TransactionButton
        className="mt-4 shadow-ztg-2"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
        loading={isBroadcasting}
      >
        Report Outcome{" "}
        {formatScalarOutcome(
          new Decimal(scalarReportValue).mul(ZTG).toFixed(0),
          market.scalarType as ScalarRangeType,
        )}
      </TransactionButton>
    </>
  );
};

export default ScalarReportBox;
