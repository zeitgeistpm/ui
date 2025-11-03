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
    <div className="mb-2 flex h-[36px] w-full items-center gap-x-1 rounded-lg bg-white/10 px-2 py-1 shadow-sm backdrop-blur-sm sm:h-[42px] sm:gap-x-1.5 sm:px-3 sm:py-1.5">
      {filters.map((filter, index) => (
        <button
          key={index}
          className={`flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-xs font-semibold transition-all active:scale-95 sm:px-3 sm:py-2 sm:text-sm ${
            filter.label === value.label
              ? "bg-ztg-green-600/90 text-white shadow-md backdrop-blur-sm"
              : "text-white/70 hover:bg-white/20 hover:text-white"
          }`}
          onClick={() => onClick(filter)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default TimeFilters;
