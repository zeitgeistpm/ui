import { PropsWithChildren } from "react";
import { Icon, Plus, ChevronDown } from "react-feather";
import MarketActiveFilters from "../MarketActiveFilters";
import MarketFiltersCheckboxes from "../MarketFiltersCheckboxes";
import { useMarketFiltersContext } from "../MarketFiltersContainer";
import { SelectionType } from "./types";

type FilterButtonProps = PropsWithChildren<{
  RightIcon: Icon;
  onClick: () => void;
  className?: string;
}>;

const FilterButton = ({
  children,
  RightIcon,
  onClick,
  className = "",
}: FilterButtonProps) => {
  return (
    <div
      className={
        "flex items-center h-10 cursor-pointer border-b border-gray-200 box-content mb-5" +
        className
      }
      onClick={onClick}
    >
      <div>{children}</div>
      <RightIcon className="ml-auto" size={24} />
    </div>
  );
};

export type FiltersListProps = {
  showSelection: (type: SelectionType) => void;
  close: () => void;
};

const FiltersList = ({ showSelection, close }: FiltersListProps) => {
  const { activeFilters, ordering } = useMarketFiltersContext();
  return (
    <>
      <MarketActiveFilters className="flex flex-row w-full justify-center gap-2 flex-wrap mb-5 " />
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showSelection("Category");
        }}
      >
        Category
      </FilterButton>
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showSelection("Currency");
        }}
      >
        Currency
      </FilterButton>
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showSelection("Status");
        }}
      >
        Status
      </FilterButton>
      <FilterButton
        RightIcon={ChevronDown}
        onClick={() => {
          showSelection("Sort By");
        }}
      >
        Sort By: {ordering}
      </FilterButton>
      <MarketFiltersCheckboxes className="mt-4" />
      <button
        className="rounded-full bg-ztg-blue mt-auto h-14 text-white"
        onClick={close}
      >
        Show Markets
      </button>
    </>
  );
};

export default FiltersList;
