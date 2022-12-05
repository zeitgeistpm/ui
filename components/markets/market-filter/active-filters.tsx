import { MarketFilter } from "lib/types/market-filter";
import { ClearAllBtn } from "./ui";

export type MarketActiveFilterProps = {
  filter: MarketFilter;
  onRemove: (filter: MarketFilter) => void;
};

export const MarketActiveFilterItem = ({
  filter,
  onRemove,
}: MarketActiveFilterProps) => {
  return (
    <div className="flex px-ztg-10 py-ztg-5 rounded-ztg-5 bg-gray-400 text-gray-800 font-normal text-ztg-14-150 gap-ztg-5">
      <button className="w-ztg-8" onClick={() => onRemove(filter)}>
        X
      </button>
      {filter.label}
    </div>
  );
};

export type MarketActiveFiltersProps = {
  filters: MarketFilter[];
  onClear: () => void;
  onFilterRemove: (filter: MarketFilter) => void;
};

export const MarketActiveFilters = ({
  filters,
  onClear,
  onFilterRemove,
}: MarketActiveFiltersProps) => {
  return (
    <div className="w-full flex gap-ztg-2">
      {filters.length > 0 && <ClearAllBtn clear={onClear} />}
      {filters.map((af, idx) => (
        <MarketActiveFilterItem
          filter={af}
          onRemove={onFilterRemove}
          key={`af-${idx}`}
        />
      ))}
    </div>
  );
};
