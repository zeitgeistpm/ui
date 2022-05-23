import { observer } from "mobx-react";
import { ChevronsDown, ChevronsUp } from "react-feather";
import React, { FC, useMemo } from "react";
import { allMarketsFiltersOff, marketStatuses } from "lib/constants";
import {
  FilterOptions,
  MarketsFilterOptions,
  MarketStatus,
  SortOptions,
} from "lib/types";
import ToggleButton from "../../ui/ToggleButton";
import { activeStatusesFromFilters } from "lib/util/market";
import { useContentWidth } from "components/context/ContentDimensionsContext";

const FilterButton: FC<{
  name: keyof MarketsFilterOptions;
  isActive?: boolean;
  onChange: (active: boolean) => void;
}> = observer(({ name, onChange, isActive }) => {
  let activeClasses = " font-bold";
  if ([...marketStatuses].includes(name as MarketStatus)) {
    activeClasses = `${activeClasses} status-color-${name.toLowerCase()}`;
  }
  return (
    <ToggleButton isActive={isActive} onChange={onChange}>
      {name}
    </ToggleButton>
  );
});

export interface MainFiltersProps {
  filters: FilterOptions;
  sortOptions: SortOptions;
  onFiltersChange: (filters: MarketsFilterOptions) => void;
  onSortOptionChange: (option: SortOptions) => void;
}

const MainFilters: FC<MainFiltersProps> = observer(
  ({ filters, sortOptions, onFiltersChange, onSortOptionChange }) => {
    const OrderingIcon = useMemo(() => {
      const order = sortOptions.order;

      if (order === "asc") {
        return ChevronsDown;
      } else {
        return ChevronsUp;
      }
    }, [sortOptions]);

    const mainWidth = useContentWidth();

    const sortByNewest = () => {
      onSortOptionChange({ ...sortOptions, sortBy: "CreatedAt" });
    };

    const sortByEnds = () => {
      onSortOptionChange({ ...sortOptions, sortBy: "EndDate" });
    };

    const toggleOrder = () => {
      const newOrder = sortOptions.order === "asc" ? "desc" : "asc";
      onSortOptionChange({ ...sortOptions, order: newOrder });
    };

    const setStatusFilter = (status: MarketStatus, active: boolean) => {
      const newFilters = { ...filters, [status]: active };
      const statuses = activeStatusesFromFilters(newFilters);
      if (filters.Proposed === false && statuses.includes("Proposed")) {
        onFiltersChange({ ...allMarketsFiltersOff, Proposed: true });
      } else if (statuses.length === 1 && statuses[0] === "Active") {
        onFiltersChange(newFilters);
      } else {
        onFiltersChange({
          ...newFilters,
          Proposed: false,
          HasLiquidityPool: true,
        });
      }
    };

    const setHasLiquidityPool = (hasPool: boolean) => {
      onFiltersChange({ ...filters, HasLiquidityPool: hasPool });
    };

    const clearFilters = () => {
      onFiltersChange(allMarketsFiltersOff);
    };

    const disableLiquidityFilter = useMemo(() => {
      const statuses = activeStatusesFromFilters(filters);
      if (
        statuses.length === 0 ||
        (statuses.length === 1 && statuses[0] === "Active")
      ) {
        return false;
      }
      return true;
    }, [filters]);

    return (
      <div
        className={
          "flex flex-row items-center mb-ztg-30 " +
          (mainWidth < 720 ? "flex-wrap" : "")
        }
      >
        <div
          style={
            mainWidth >= 720
              ? { display: "flex", flexBasis: "400px", flexGrow: 1 }
              : {
                  display: "flex",
                  width: "100%",
                  flexGrow: 1,
                  marginBottom: "6px",
                }
          }
        >
          {marketStatuses.map((status, idx) => {
            return (
              <FilterButton
                key={idx}
                isActive={filters[status]}
                onChange={(active) => setStatusFilter(status, active)}
                name={status}
              />
            );
          })}
        </div>
        <div className="flex flex-grow">
          <ToggleButton
            isActive={sortOptions.sortBy === "CreatedAt"}
            onChange={sortByNewest}
          >
            Newest
          </ToggleButton>
          <ToggleButton
            isActive={sortOptions.sortBy === "EndDate"}
            onChange={sortByEnds}
          >
            Ends soon
          </ToggleButton>
          <ToggleButton
            isActive={filters.HasLiquidityPool}
            onChange={() => {
              if (!disableLiquidityFilter) {
                setHasLiquidityPool(!filters.HasLiquidityPool);
              }
            }}
          >
            Liquidity
          </ToggleButton>

          <div
            className="h-ztg-32 w-ztg-80 flex-grow rounded-full center text-ztg-10-150 cursor-pointer border-2 border-black dark:border-white ml-ztg-8 font-lato"
            onClick={() => clearFilters()}
          >
            Clear All
          </div>
          <div className="w-ztg-40 h-ztg-32 cursor-pointer flex items-center ml-auto flex-shrink-0">
            <OrderingIcon
              size={16}
              onClick={() => toggleOrder()}
              className="ml-auto"
            />
          </div>
        </div>
      </div>
    );
  }
);

export default MainFilters;
