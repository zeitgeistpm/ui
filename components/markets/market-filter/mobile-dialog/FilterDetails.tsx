import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
} from "lib/constants/market-filter";
import { ChevronLeft, X } from "react-feather";
import { useMarketFiltersContext } from "../MarketFiltersContainer";
import { SelectedMenu } from "../MarketFiltersContainer";
import { MarketFilter } from "lib/types/market-filter";

type FilterDetailsProps = {
  back: () => void;
  menu: SelectedMenu;
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
    <div className="mb-7 w-1/2">
      <a
        className={"cursor-pointer " + (isActive ? "text-ztg-blue" : "")}
        onClick={() => {
          toggle();
        }}
      >
        {option.label}{" "}
        {isActive ? <X className="inline text-gray-600" size={14} /> : ""}
      </a>
    </div>
  );
};

const FilterDetails = ({ back, menu }: FilterDetailsProps) => {
  return (
    <>
      <a
        className="mr-auto mt-1 flex cursor-pointer text-sky-600"
        onClick={back}
      >
        <ChevronLeft className="w-6" transform="translate(-6, 0)" />{" "}
        <div className="inline-block">Back</div>
      </a>
      <h3 className="my-7 text-2xl">{menu}</h3>
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
          }[menu]
        }
      </div>
      <button
        className="mt-auto h-14 rounded-full bg-ztg-blue text-white"
        onClick={back}
      >
        Apply
      </button>
    </>
  );
};

export default FilterDetails;
