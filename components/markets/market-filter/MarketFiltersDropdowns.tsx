import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
} from "lib/constants/market-filter";
import DropDownSelect from "./DropDownSelect";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import { MarketFilter } from "lib/types/market-filter";

export type MarketFiltersDropdownsProps = {
  className?: string;
};

const MarketFiltersDropdowns = ({
  className = "",
}: MarketFiltersDropdownsProps) => {
  const {
    selectedMenu,
    portal,
    addActiveFilter,
    removeActiveFilter,
    activeFilters,
    setSelectedMenu,
  } = useMarketFiltersContext();

  const updateFilters = (marketFilter: MarketFilter) => {
    const isFilterActive = activeFilters.find(
      (filter) => filter.value === marketFilter.value,
    );

    isFilterActive
      ? removeActiveFilter(marketFilter)
      : addActiveFilter(marketFilter);
    
    // Close the menu after selection
    setSelectedMenu("None");
  };
  return (
    <div className={className}>
      <DropDownSelect
        label="Category"
        options={marketTagFilterOptions}
        onChange={updateFilters}
        portal={portal}
        isOpen={selectedMenu === "Category"}
      />
      <DropDownSelect
        label="Currency"
        options={marketCurrencyFilterOptions}
        onChange={updateFilters}
        portal={portal}
        isOpen={selectedMenu === "Currency"}
      />
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        onChange={updateFilters}
        portal={portal}
        isOpen={selectedMenu === "Status"}
      />
    </div>
  );
};

export default MarketFiltersDropdowns;
