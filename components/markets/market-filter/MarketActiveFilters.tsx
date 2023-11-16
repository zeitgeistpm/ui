import { MarketFilter } from "lib/types/market-filter";
import { X } from "react-feather";
import ClearAllButton from "./ClearAllButton";
import { useMarketFiltersContext } from "./MarketFiltersContainer";

export type MarketActiveFilterItemProps = {
  filter: MarketFilter;
  onRemove: (filter: MarketFilter) => void;
};

export const MarketActiveFilterItem = ({
  filter,
  onRemove,
}: MarketActiveFilterItemProps) => {
  return (
    <div className="flex gap-ztg-5 rounded-ztg-5 bg-sky-200 px-ztg-10 py-ztg-5 text-ztg-14-150 font-normal text-gray-800">
      <button onClick={() => onRemove(filter)}>
        <X size={16} className="text-gray-800"></X>
      </button>
      {filter.label}
    </div>
  );
};

export type MarketActiveFiltersProps = {
  className?: string;
};

const MarketActiveFilters = ({ className = "" }: MarketActiveFiltersProps) => {
  const { activeFilters, clearActiveFilters, removeActiveFilter } =
    useMarketFiltersContext();
  return (
    <>
      {activeFilters?.length > 0 && (
        <div className={className}>
          {activeFilters.length > 0 && (
            <ClearAllButton clear={clearActiveFilters} />
          )}
          {activeFilters.map((af, idx) => (
            <MarketActiveFilterItem
              filter={af}
              onRemove={removeActiveFilter}
              key={`af-${idx}`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default MarketActiveFilters;
