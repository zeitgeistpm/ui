import { DAY_SECONDS } from "lib/constants";
import { observer } from "mobx-react";

export interface TimeFilter {
  label: FilterLabel;
  startTime: string; // ISO string
  timeUnit: TimeUnit;
  timeValue: number;
}

export type FilterLabel = "All" | "Day" | "Week" | "Month";

export type TimeUnit = "Second" | "Minute" | "Hour" | "Day";

export const filters: TimeFilter[] = [
  {
    label: "Day",
    startTime: new Date(
      new Date().getTime() - DAY_SECONDS * 1000,
    ).toISOString(),
    timeUnit: "Hour",
    timeValue: 1,
  },
  {
    label: "Week",
    startTime: new Date(
      new Date().getTime() - DAY_SECONDS * 1000 * 7,
    ).toISOString(),
    timeUnit: "Hour",
    timeValue: 6,
  },
  {
    label: "Month",
    startTime: new Date(
      new Date().getTime() - DAY_SECONDS * 1000 * 30,
    ).toISOString(),
    timeUnit: "Day",
    timeValue: 1,
  },
  {
    label: "All",
    startTime: new Date("Wed Dec 30 2020").toISOString(),
    timeUnit: "Day",
    timeValue: 1,
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
    return (
      <div className="flex items-center gap-x-2 mb-1 bg-sky-100 h-[35px] py-[8px] px-[12px] rounded-ztg-10 w-fit">
        {filters.map((filter, index) => (
          <span
            key={index}
            className={`text-ztg-12-150 rounded-ztg-5 w-[47px] flex justify-center ${
              filter.label === value.label ? "bg-white shadow-sm" : ""
            }`}
          >
            <button
              className="focus:outline-none py-ztg-2 px-ztg-4 "
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
