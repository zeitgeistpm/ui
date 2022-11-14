import { DateTimeInput } from "components/ui/inputs";
import { useChainTimeNow } from "lib/hooks/queries/useChainTime";
import { useMarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import { useEffect, useState } from "react";

export type MarketDeadlineInputType = "grace" | "oracle" | "dispute";

export type MarketDeadlinesValue = {
  grace: GracePeriodValue;
  oracle: OracleAndDisputePeriodValue;
  dispute: OracleAndDisputePeriodValue;
};

export type GracePeriodValue =
  | {
      label: "None";
      value: 0;
    }
  | {
      label: "1 Hour";
      value: 300;
    }
  | {
      label: "1 Day";
      value: 7200;
    }
  | {
      label: "Custom";
      value: Date;
    };

export type OracleAndDisputePeriodValue =
  | {
      label: "1 Day";
      value: 7200;
    }
  | {
      label: "4 Days";
      value: 28800;
    }
  | {
      label: "Custom";
      value: {
        days: number;
        hours: number;
      };
    };

export const MarketDeadlinesInput = (props: {
  value: MarketDeadlinesValue;
  onChange: (value: MarketDeadlinesValue) => void;
}) => {
  const { data: now } = useChainTimeNow();
  const { data: constants } = useMarketDeadlineConstants();

  const [tab, setTab] = useState<MarketDeadlineInputType>("grace");

  return (
    <>
      <div
        className="inline-flex h-ztg-40 items-center px-ztg-10
        rounded-full justify-between mr-ztg-27 bg-mid-content-lt dark:bg-sky-1000 mb-ztg-20"
      >
        <div
          onClick={() => setTab("grace")}
          className={`rounded-full h-ztg-24 px-8 flex items-center cursor-pointer font-medium ${
            tab === "grace" && "bg-white"
          }`}
        >
          Set Grace Period*
        </div>
        <div
          onClick={() => setTab("oracle")}
          className={`rounded-full h-ztg-24 px-8 flex items-center cursor-pointer font-medium ${
            tab === "oracle" && "bg-white"
          }`}
        >
          Set Oracle Duration
        </div>
        <div
          onClick={() => setTab("dispute")}
          className={`rounded-full h-ztg-24 px-8 flex items-center cursor-pointer font-medium ${
            tab === "dispute" && "bg-white"
          }`}
        >
          Set Dispute Duration
        </div>
      </div>
      <div className="flex w-full mb-ztg-20 h-14 items-center">
        {tab === "grace" ? (
          <GracePeriodInput
            value={props.value.grace}
            onChange={(grace) => props.onChange({ ...props.value, grace })}
          />
        ) : tab === "oracle" ? (
          <OracleAndDisputePeriodInput
            value={props.value.oracle}
            onChange={(oracle) => props.onChange({ ...props.value, oracle })}
          />
        ) : (
          <OracleAndDisputePeriodInput
            value={props.value.dispute}
            onChange={(dispute) => props.onChange({ ...props.value, dispute })}
          />
        )}
      </div>
    </>
  );
};

const GracePeriodInput = (props: {
  value: GracePeriodValue;
  onChange: (value: GracePeriodValue) => void;
}) => {
  return (
    <>
      <div
        onClick={() => props.onChange({ label: "None", value: 0 })}
        className={`cursor-pointer border-1  py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600 ${
          props.value.label === "None" && "border-gray-700"
        }`}
      >
        None
      </div>
      <div
        onClick={() => props.onChange({ label: "1 Hour", value: 300 })}
        className={`cursor-pointer border-1  py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600 ${
          props.value.label === "1 Hour" && "border-gray-700"
        }`}
      >
        1 Hour
      </div>
      <div
        onClick={() => {
          props.onChange({ label: "1 Day", value: 7200 });
        }}
        className={`cursor-pointer border-1 py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600 ${
          props.value.label === "1 Day" && "border-gray-700"
        }`}
      >
        1 Day
      </div>
      <div
        className={`border-1 rounded-lg ${
          props.value.label === "Custom" && "border-gray-700"
        }`}
      >
        <DateTimeInput
          timestamp={
            props.value.label === "Custom"
              ? props.value.value.getTime()
              : Date.now() + 2 * 24 * 60 * 60 * 1000
          }
          name="grace-period"
          onChange={(date) => {
            props.onChange({ label: "Custom", value: new Date(date) });
          }}
        />
      </div>
    </>
  );
};

const OracleAndDisputePeriodInput = (props: {
  value: OracleAndDisputePeriodValue;
  onChange: (value: OracleAndDisputePeriodValue) => void;
}) => {
  return (
    <>
      <div
        onClick={() => props.onChange({ label: "1 Day", value: 7200 })}
        className={`cursor-pointer border-1  py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600 ${
          props.value.label === "1 Day" && "border-gray-700"
        }`}
      >
        1 Day
      </div>
      <div
        onClick={() => props.onChange({ label: "4 Days", value: 28800 })}
        className={`cursor-pointer border-1 py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600 ${
          props.value.label === "4 Days" && "border-gray-700"
        }`}
      >
        4 Days
      </div>
      <div className={"flex"}>
        <div
          className={`flex w-32 mr-4 border-1 ${
            props.value.label === "Custom" && "border-gray-700 rounded-ztg-5"
          }`}
        >
          <input
            type="number"
            onChange={(e) => {
              props.onChange({
                label: "Custom",
                value: {
                  hours:
                    props.value.label === "4 Days" ||
                    props.value.label === "1 Day"
                      ? 0
                      : props.value.value.hours,
                  days: Number(e.target.value),
                },
              });
            }}
            value={
              props.value.label === "4 Days"
                ? 4
                : props.value.label === "1 Day"
                ? 1
                : props.value.value.days
            }
            className="bg-sky-200 dark:bg-black text-ztg-14-150 w-full rounded-ztg-5 h-ztg-40 p-ztg-8 font-lato focus:outline-none border-1 dark:border-black text-black dark:text-white text-right  w-18"
          />
          <div className="bg-sky-200 dark:bg-black text-ztg-14-150  -ml-2 font-bold rounded-ztg-5 h-ztg-40 p-ztg-8 font-lato focus:outline-none border-1 dark:border-black text-black dark:text-white text-right  w-14">
            DAYS
          </div>
        </div>
        <div
          className={`flex w-32 mr-4 border-1 ${
            props.value.label === "Custom" && "border-gray-700 rounded-ztg-5"
          }`}
        >
          <input
            type="number"
            onChange={(e) => {
              props.onChange({
                label: "Custom",
                value: {
                  hours: Number(e.target.value),
                  days:
                    props.value.label === "4 Days"
                      ? 4
                      : props.value.label === "1 Day"
                      ? 1
                      : props.value.value.days,
                },
              });
            }}
            value={
              props.value.label === "4 Days" || props.value.label === "1 Day"
                ? 0
                : props.value.value.hours
            }
            className="bg-sky-200 dark:bg-black text-ztg-14-150 w-full rounded-ztg-5 h-ztg-40 p-ztg-8 font-lato focus:outline-none border-1 dark:border-black text-black dark:text-white text-right  w-18"
          />
          <div className="bg-sky-200 dark:bg-black text-ztg-14-150 w-full -ml-2 font-bold rounded-ztg-5 h-ztg-40 p-ztg-8 font-lato focus:outline-none border-1 dark:border-black text-black dark:text-white text-right  w-18">
            HOURS
          </div>
        </div>
      </div>
    </>
  );
};
