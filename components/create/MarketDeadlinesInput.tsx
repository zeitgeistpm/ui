import React from "react";
import { useState } from "react";

export type MarketDeadlineInputType = "grace" | "oracle" | "dispute";

export type MarketDeadlineValue = { [key in MarketDeadlineInputType]: {} };

export const MarketDeadlinesInput = () => {
  const [tab, setTab] = useState<MarketDeadlineInputType>("grace");
  const [value, setValue] = useState<MarketDeadlineValue>({});

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
      <div className="flex w-full mb-ztg-20">
        <div
          className="cursor-pointer border-1  py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600"
        >
          1 Hour
        </div>
        <div
          className="cursor-pointer border-1 py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200  text-sky-600"
        >
          1 day
        </div>
      </div>
    </>
  );
};
