import { DAY_SECONDS } from "lib/constants";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

export interface TimeFilter {
  label: FilterResolution;
  time: string; // ISO string
}

export type FilterResolution = "Day" | "Week" | "Month";

export const filters: TimeFilter[] = [
  {
    label: "Day",
    time: new Date(new Date().getTime() - DAY_SECONDS * 1000).toISOString(),
  },
  {
    label: "Week",
    time: new Date(new Date().getTime() - DAY_SECONDS * 1000 * 7).toISOString(),
  },
  {
    label: "Month",
    time: new Date(
      new Date().getTime() - DAY_SECONDS * 1000 * 30,
    ).toISOString(),
  },
];

const TimeFilters = observer(
  ({
    value,
    onClick,
  }: {
    value: TimeFilter;
    onClick: (filter: TimeFilter) => void;
  }) => {
    const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>();

    return (
      <div className="flex gap-x-2 mb-1">
        {filters.map((filter, index) => (
          <span
            key={index}
            className={`text-sky-600 font-space text-ztg-10-150 rounded-ztg-100 w-[47px] flex justify-center ${
              filter.label === value.label
                ? "bg-sky-300 dark:bg-black"
                : "bg-sky-100 dark:bg-sky-800"
            }`}
          >
            <button
              className="focus:outline-none py-ztg-2 px-ztg-8 "
              onClick={() => onClick(filter)}
            >
              {filter.label}
            </button>
          </span>
        ))}
      </div>
    );
  },
);

export default TimeFilters;
