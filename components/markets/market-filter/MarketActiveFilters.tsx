import { MarketFilter } from "lib/types/market-filter";
import { X } from "react-feather";
import ClearAllButton from "./ClearAllButton";

export type MarketActiveFilterProps = {
  filter: MarketFilter;
  onRemove: (filter: MarketFilter) => void;
};

export const MarketActiveFilterItem = ({
  filter,
  onRemove,
}: MarketActiveFilterProps) => {
  return (
    <div className="flex px-ztg-10 py-ztg-5 rounded-ztg-5 bg-sky-200 text-gray-800 font-normal text-ztg-14-150 gap-ztg-5">
      <button onClick={() => onRemove(filter)}>
        <X size={16} className="text-gray-800"></X>
      </button>
      {filter.label}
    </div>
  );
};

export type MarketActiveFiltersProps = {
  filters: MarketFilter[];
  onClear: () => void;
  onFilterRemove: (filter: MarketFilter) => void;
  className?: string;
};

const MarketActiveFilters = ({
  filters,
  onClear,
  onFilterRemove,
  className = "",
}: MarketActiveFiltersProps) => {
  return (
    <div className={className}>
      {filters?.length > 0 && <ClearAllButton clear={onClear} />}
      {filters?.map((af, idx) => (
        <MarketActiveFilterItem
          filter={af}
          onRemove={onFilterRemove}
          key={`af-${idx}`}
        />
      ))}
    </div>
  );
};

export default MarketActiveFilters;
