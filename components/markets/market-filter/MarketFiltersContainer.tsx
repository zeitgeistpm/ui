import { MarketFilter, MarketsOrderBy } from "lib/types/market-filter";
import { createContext, FC, PropsWithChildren, useContext } from "react";

export type SelectedMenu = "Category" | "Currency" | "Status" | "None";

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

export type MarketFiltersContainerProps = PropsWithChildren<{
  activeFilters: MarketFilter[];
  portal: HTMLDivElement;
}>;

const MarketFiltersContainer: FC<PropsWithChildren<MarketFiltersProps>> = (
  props,
) => {
  return (
    <MarketFiltersContext.Provider value={{ ...props }}>
      <h2 className="text-center mb-4">All Markets</h2>
      {props.children}
    </MarketFiltersContext.Provider>
  );
};

export default MarketFiltersContainer;
