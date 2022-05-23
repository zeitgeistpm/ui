import { observer } from "mobx-react";
import React, { useMemo } from "react";
import { ChevronsDown, ChevronsUp } from "react-feather";
import { FilterOptions, SortOptions } from "lib/types";
import ToggleButton from "components/ui/ToggleButton";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";

export type MyFiltersProps = {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onSortOptionChange: (option: SortOptions) => void;
};

const MyFilters = observer(
  ({ filters, onFiltersChange, onSortOptionChange }: MyFiltersProps) => {
    const { sorting } = useMarketsUrlQuery();
    const toggleOrder = () => {
      const newOrder = sorting.order === "asc" ? "desc" : "asc";
      onSortOptionChange({ ...sorting, order: newOrder });
    };

    const OrderingIcon = useMemo(() => {
      const order = sorting.order;

      if (order === "asc") {
        return ChevronsDown;
      } else {
        return ChevronsUp;
      }
    }, [sorting]);

    return (
      <div className="flex items-center mb-ztg-30 flex-wrap">
        <ToggleButton
          isActive={filters.oracle}
          onChange={() => {
            const oracle = !filters.oracle;
            onFiltersChange({ ...filters, oracle });
          }}
          className="max-w-ztg-184"
        >
          Oracle
        </ToggleButton>

        <ToggleButton
          isActive={filters.creator}
          onChange={() => {
            const creator = !filters.creator;
            onFiltersChange({ ...filters, creator });
          }}
          className="max-w-ztg-184"
        >
          Creator
        </ToggleButton>

        <ToggleButton
          isActive={filters.hasAssets}
          onChange={() => {
            const hasAssets = !filters.hasAssets;
            onFiltersChange({ ...filters, hasAssets });
          }}
          className="max-w-ztg-184"
        >
          Assets in market
        </ToggleButton>

        <div
          className="h-ztg-32 w-ztg-80 rounded-full center text-ztg-10-150 cursor-pointer border-2 border-black dark:border-white ml-ztg-8 flex-grow font-lato max-w-ztg-184"
          onClick={() =>
            onFiltersChange({
              ...filters,
              creator: true,
              oracle: false,
              hasAssets: false,
            })
          }
        >
          Clear All
        </div>
        <div className="w-ztg-40 flex items-center h-ztg-32 cursor-pointer ml-auto">
          <OrderingIcon
            size={16}
            onClick={() => toggleOrder()}
            className="ml-auto"
          />
        </div>
      </div>
    );
  }
);

export default MyFilters;
