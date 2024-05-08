import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
} from "lib/constants/market-filter";
import DropDownSelect from "./DropDownSelect";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import { isCampaignAsset } from "lib/constants";
import { MarketFilter } from "lib/types/market-filter";

export type MarketFiltersDropdownsProps = {
  className?: string;
};

const Divider = () => {
  return (
    <div className="hidden h-[10px] w-[1px] bg-pastel-blue lg:block"></div>
  );
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
  } = useMarketFiltersContext();

  const updateFilters = (marketFilter: MarketFilter) => {
    const isFilterActive = activeFilters.find(
      (filter) => filter.value === marketFilter.value,
    );

    isFilterActive
      ? removeActiveFilter(marketFilter)
      : addActiveFilter(marketFilter);
  };
  return (
    <div className={className}>
      {!isCampaignAsset && (
        <>
          <DropDownSelect
            label="Category"
            options={marketTagFilterOptions}
            onChange={updateFilters}
            portal={portal}
            isOpen={selectedMenu === "Category"}
          />
          <Divider />
          <DropDownSelect
            label="Currency"
            options={marketCurrencyFilterOptions}
            onChange={updateFilters}
            portal={portal}
            isOpen={selectedMenu === "Currency"}
          />
        </>
      )}
      <Divider />
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        onChange={updateFilters}
        portal={portal}
        isOpen={selectedMenu === "Status"}
      />
      <Divider />
    </div>
  );
};

export default MarketFiltersDropdowns;
