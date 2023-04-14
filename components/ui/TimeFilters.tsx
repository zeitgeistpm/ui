import { DAY_SECONDS } from "lib/constants";
import { observer } from "mobx-react";

export interface TimeFilter {
  label: FilterLabel;
  timePeriodMS?: number;
  resolutionUnit: TimeUnit;
  resolutionValue: number;
}

export type FilterLabel = "All" | "Day" | "Week" | "Month";

export type TimeUnit = "Second" | "Minute" | "Hour" | "Day";

export const filters: TimeFilter[] = [
  {
    label: "Day",
    timePeriodMS: DAY_SECONDS * 1000,
    resolutionUnit: "Hour",
    resolutionValue: 1,
  },
  {
    label: "Week",
    timePeriodMS: DAY_SECONDS * 1000 * 7,
    resolutionUnit: "Hour",
    resolutionValue: 6,
  },
  {
    label: "Month",
    timePeriodMS: DAY_SECONDS * 1000 * 30,
    resolutionUnit: "Day",
    resolutionValue: 1,
  },
  {
    label: "All",
    resolutionUnit: "Day",
    resolutionValue: 1,
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
