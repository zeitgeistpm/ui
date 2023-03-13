import { MarketFilter } from "lib/types/market-filter";
import { observer } from "mobx-react";
import { createContext, FC, PropsWithChildren, useState } from "react";

export type SelectedMenu = "Category" | "Currency" | "Status" | "None";

export const MarketFiltersContext = createContext<{
  activeFilters: MarketFilter[];
  selectedMenu: SelectedMenu;
  setSelectedMenu: (menu: SelectedMenu) => void;
  portal: HTMLDivElement;
}>(null);

const MarketFiltersContainer: FC<
  PropsWithChildren<{
    activeFilters: MarketFilter[];
    portal: HTMLDivElement;
  }>
> = observer(({ children, activeFilters, portal }) => {
  const [selectedMenu, setSelectedMenu] = useState<SelectedMenu>("None");

  return (
    <MarketFiltersContext.Provider
      value={{ activeFilters, selectedMenu, setSelectedMenu, portal }}
    >
      <div className="font-bold text-[28px] text-center mb-[15px]">
        All Markets
      </div>
      <div className="w-full flex flex-col items-center justify-center mb-[30px]">
        {children}
      </div>
    </MarketFiltersContext.Provider>
  );
});

export default MarketFiltersContainer;
