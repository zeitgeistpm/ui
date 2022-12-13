import { DAY_SECONDS } from "lib/constants";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

export interface TimeFilter {
  label: string;
  time: string; // ISO string
}

const TimeFilters = observer(
  ({ onClick }: { onClick: (filter: TimeFilter) => void }) => {
    const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>();

    const filters: TimeFilter[] = [
      {
        label: "Day",
        time: new Date(new Date().getTime() - DAY_SECONDS * 1000).toISOString(),
      },
      {
        label: "Week",
        time: new Date(
          new Date().getTime() - DAY_SECONDS * 1000 * 7,
        ).toISOString(),
      },
      {
        label: "Month",
        time: new Date(
          new Date().getTime() - DAY_SECONDS * 1000 * 30,
        ).toISOString(),
      },
    ];

    useEffect(() => {
      handleClick(1);
    }, []);

    const handleClick = (filterIndex: number) => {
      if (selectedFilterIndex !== filterIndex) {
        onClick(filters[filterIndex]);
        setSelectedFilterIndex(filterIndex);
      }
    };
    return (
      <div className="flex gap-x-2 mb-1">
        {filters.map((filter, index) => (
          <span
            key={index}
            className={`text-sky-600  text-ztg-10-150 rounded-ztg-100 w-[47px] flex justify-center ${
              selectedFilterIndex === index
                ? "bg-sky-300 dark:bg-black"
                : "bg-sky-100 dark:bg-sky-800"
            }`}
          >
            <button
              className="focus:outline-none py-ztg-2 px-ztg-8 "
              onClick={() => handleClick(index)}
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
