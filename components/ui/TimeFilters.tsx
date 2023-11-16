import { DAY_SECONDS } from "lib/constants";

export interface TimeFilter {
  label: FilterLabel;
  timePeriodMS?: number;
  intervalUnit: TimeUnit;
  intervalValue: number;
}

export type FilterLabel = "All" | "Day" | "Week" | "Month";

export type TimeUnit = "Second" | "Minute" | "Hour" | "Day";

export const filters: TimeFilter[] = [
  {
    label: "Day",
    timePeriodMS: DAY_SECONDS * 1000,
    intervalUnit: "Hour",
    intervalValue: 1,
  },
  {
    label: "Week",
    timePeriodMS: DAY_SECONDS * 1000 * 7,
    intervalUnit: "Hour",
    intervalValue: 6,
  },
  {
    label: "Month",
    timePeriodMS: DAY_SECONDS * 1000 * 30,
    intervalUnit: "Day",
    intervalValue: 1,
  },
  {
    label: "All",
    intervalUnit: "Day",
    intervalValue: 1,
  },
];

const TimeFilters = ({
  value,
  onClick,
}: {
  value: TimeFilter;
  onClick: (filter: TimeFilter) => void;
}) => {
  return (
    <div className="mb-1 flex h-[35px] w-fit items-center gap-x-2 rounded-ztg-10 bg-sky-100 px-[12px] py-[8px]">
      {filters.map((filter, index) => (
        <span
          key={index}
          className={`flex w-[47px] justify-center rounded-ztg-5 text-ztg-12-150 ${
            filter.label === value.label ? "bg-white shadow-sm" : ""
          }`}
        >
          <button
            className="px-ztg-4 py-ztg-2 focus:outline-none "
            onClick={() => onClick(filter)}
          >
            {filter.label}
          </button>
        </span>
      ))}
    </div>
  );
};

export default TimeFilters;
