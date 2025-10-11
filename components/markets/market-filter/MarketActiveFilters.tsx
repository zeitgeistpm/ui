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
    <div className="flex items-center gap-1 rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800 transition-all hover:bg-sky-200">
      <span>{filter.label}</span>
      <button
        onClick={() => onRemove(filter)}
        className="flex items-center transition-transform hover:scale-110"
      >
        <X size={12} className="text-sky-800"></X>
      </button>
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
        <div className={`flex flex-row items-center gap-1.5 ${className}`}>
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
