import { MarketFilter } from "lib/types/market-filter";
import { observer } from "mobx-react";
import { createContext, FC, PropsWithChildren } from "react";

export const ActiveFiltersContext = createContext<MarketFilter[]>(null);

const MarketFiltersContainer: FC<
  PropsWithChildren<{ activeFilters: MarketFilter[] }>
> = observer(({ children, activeFilters }) => {
  return (
    <ActiveFiltersContext.Provider value={activeFilters}>
      <div className="font-bold text-[28px] text-center mb-[15px]">
        All Markets
      </div>
      <div className="w-full flex flex-col items-center justify-center mb-[30px]">
        {children}
      </div>
    </ActiveFiltersContext.Provider>
  );
});

export default MarketFiltersContainer;
