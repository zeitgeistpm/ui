import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
} from "lib/constants/market-filter";
import { ChevronLeft } from "react-feather";
import { useMarketFiltersContext } from "../MarketFiltersContainer";
import { SelectionType } from "./types";
import { MarketFilter } from "lib/types/market-filter";

type FilterDetailsProps = {
  back: () => void;
  type: SelectionType;
};

const FilterToggle = ({ option }: { option: MarketFilter }) => {
  const { addActiveFilter, removeActiveFilter, activeFilters } =
    useMarketFiltersContext();
  const isActive = activeFilters?.some(
    (af) => af.type === option.type && af.value === option.value,
  );
  const toggle = () => {
    if (isActive) {
      removeActiveFilter(option);
    } else {
      addActiveFilter(option);
    }
  };

  return (
    <a
      className={
        "w-1/2 mb-7 cursor-pointer " + (isActive ? "text-ztg-blue" : "")
      }
      onClick={() => {
        toggle();
      }}
    >
      {option.value}
    </a>
  );
};

const FilterDetails = ({ back, type }: FilterDetailsProps) => {
  return (
    <>
      <a
        className="cursor-pointer flex mr-auto text-sky-600 mt-1"
        onClick={back}
      >
        <ChevronLeft className="w-6" transform="translate(-6, 0)" />{" "}
        <div className="inline-block">Back</div>
      </a>
      <h3 className="text-2xl my-7">{type}</h3>
      <div className="flex flex-wrap">
        {
          {
            Category: (
              <>
                {marketTagFilterOptions.map((opt, index) => (
                  <FilterToggle option={opt} key={index} />
                ))}
              </>
            ),
            Currency: (
              <>
                {marketCurrencyFilterOptions.map((opt, index) => (
                  <FilterToggle option={opt} key={index} />
                ))}
              </>
            ),
            Status: (
              <>
                {marketStatusFilterOptions.map((opt, index) => (
                  <FilterToggle option={opt} key={index} />
                ))}
              </>
            ),
          }[type]
        }
      </div>
      <button
        className="rounded-full bg-ztg-blue mt-auto h-14 text-white"
        onClick={back}
      >
        Apply
      </button>
    </>
  );
};

export default FilterDetails;
