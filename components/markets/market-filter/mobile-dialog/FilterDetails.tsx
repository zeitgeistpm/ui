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
    <button
      onClick={toggle}
      className={`mb-3 mr-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-all ${
        isActive
          ? "bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md"
          : "bg-white text-gray-700 hover:bg-sky-50 hover:shadow-md"
      }`}
    >
      <span>{option.label}</span>
      {isActive && <X size={14} />}
    </button>
  );
};

const FilterDetails = ({ back, menu }: FilterDetailsProps) => {
  return (
    <>
      <button
        className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
        onClick={back}
      >
        <ChevronLeft size={18} />
        <span>Back</span>
      </button>
      <h3 className="mb-4 text-xl font-semibold text-gray-900">{menu}</h3>
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
        className="mt-auto h-12 rounded-lg bg-sky-600 text-sm font-semibold text-white shadow-md transition-all hover:bg-sky-700"
        onClick={back}
      >
        Apply Filters
      </button>
    </>
  );
};

export default FilterDetails;
