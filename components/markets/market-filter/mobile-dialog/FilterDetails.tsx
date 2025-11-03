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
      className={`mb-3 mr-3 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-md transition-all active:scale-[0.98] backdrop-blur-sm touch-manipulation ${
        isActive
          ? "bg-ztg-green-600/80 text-white"
          : "bg-white/15 text-white hover:bg-white/20 hover:shadow-lg"
      }`}
    >
      <span>{option.label}</span>
      {isActive && <X size={16} />}
    </button>
  );
};

const FilterDetails = ({ back, menu }: FilterDetailsProps) => {
  return (
    <>
      <button
        className="mb-5 flex items-center gap-2 text-sm font-semibold text-ztg-green-400 transition-all active:scale-95 hover:text-ztg-green-300 touch-manipulation"
        onClick={back}
      >
        <ChevronLeft size={18} />
        <span>Back</span>
      </button>
      <h3 className="mb-5 text-xl font-semibold text-white">{menu}</h3>
      <div className="flex flex-wrap pb-4">
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
        className="sticky bottom-0 mt-auto h-12 rounded-lg bg-ztg-green-600/80 text-sm font-semibold text-white shadow-md backdrop-blur-sm transition-all active:scale-[0.98] hover:bg-ztg-green-600 touch-manipulation"
        onClick={back}
      >
        Apply Filters
      </button>
    </>
  );
};

export default FilterDetails;
