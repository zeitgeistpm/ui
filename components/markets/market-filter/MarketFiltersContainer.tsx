import { Dialog } from "@headlessui/react";
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

export type MarketFiltersContainerProps = PropsWithChildren<{
  activeFilters: MarketFilter[];
  portal: HTMLDivElement;
}>;

const MarketFiltersContainer: FC<MarketFiltersContainerProps> = observer(
  ({ children, activeFilters, portal }) => {
    const [selectedMenu, setSelectedMenu] = useState<SelectedMenu>("None");

    return (
      <MarketFiltersContext.Provider
        value={{ activeFilters, selectedMenu, setSelectedMenu, portal }}
      >
        <h2 className="text-center mb-4">All Markets</h2>
        {children}
      </MarketFiltersContext.Provider>
    );
  },
);

export default MarketFiltersContainer;
