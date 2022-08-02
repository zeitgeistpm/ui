import { DAY_SECONDS } from "lib/constants";
import { useStore } from "lib/stores/Store";
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
        label: "D",
        time: new Date(new Date().getTime() - DAY_SECONDS * 1000).toISOString(),
      },
      {
        label: "W",
        time: new Date(
          new Date().getTime() - DAY_SECONDS * 1000 * 7,
        ).toISOString(),
      },
      {
        label: "M",
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
      <div className=" ">
        {filters.map((filter, index) => (
          <span
            key={index}
            className={`text-sky-600  font-bold text-ztg-14-120 ${
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
