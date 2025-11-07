import { MarketFilter, MarketsOrderBy } from "lib/types/market-filter";
import { createContext, FC, PropsWithChildren, useContext } from "react";

export type SelectedMenu =
  | "Category"
  | "Currency"
  | "Status"
  | "MarketType"
  | "Sort"
  | "None";

export type MarketFiltersProps = {
  activeFilters: MarketFilter[];
  addActiveFilter: (filter: MarketFilter) => void;
  removeActiveFilter: (filter: MarketFilter) => void;
  clearActiveFilters: () => void;
  withLiquidityOnly: boolean;
  setWithLiquidityOnly: (liqudityOnly: boolean) => void;
  ordering: MarketsOrderBy;
  setOrdering: (v: MarketsOrderBy) => void;
  portal: HTMLDivElement;
  selectedMenu: SelectedMenu;
  setSelectedMenu: (menu: SelectedMenu) => void;
};

export const MarketFiltersContext = createContext<MarketFiltersProps | null>(
  null,
);

export const useMarketFiltersContext = () => {
  const context = useContext(MarketFiltersContext);
  if (context == null) {
    throw new Error(
      "useMarketFiltersContext must be used within a MarketFiltersContainer",
    );
  }
  return context;
};

const MarketFiltersContainer: FC<PropsWithChildren<MarketFiltersProps>> = (
  props,
) => {
  return (
    <MarketFiltersContext.Provider value={{ ...props }}>
      {props.children}
    </MarketFiltersContext.Provider>
  );
};

export default MarketFiltersContainer;
