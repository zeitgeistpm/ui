import { PropsWithChildren } from "react";
import { Icon, Plus, ChevronDown } from "react-feather";
import MarketActiveFilters from "../MarketActiveFilters";
import MarketFiltersCheckboxes from "../MarketFiltersCheckboxes";
import { useMarketFiltersContext } from "../MarketFiltersContainer";
import { SelectionType } from "./types";

type FilterButtonProps = PropsWithChildren<{
  RightBtn: Icon;
  onClick: () => void;
  className?: string;
}>;

const FilterButton = ({
  children,
  RightBtn,
  onClick,
  className = "",
}: FilterButtonProps) => {
  return (
    <div
      className={"flex items-center h-10 cursor-pointer " + className}
      onClick={onClick}
    >
      <div>{children}</div>
      <RightBtn className="ml-auto" size={24} />
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
      {activeFilters && (
        <MarketActiveFilters className="flex flex-row mr-auto ml-auto gap-2" />
      )}
      <FilterButton
        RightBtn={Plus}
        onClick={() => {
          showSelection("Category");
        }}
      >
        Category
      </FilterButton>
      <FilterButton
        RightBtn={Plus}
        onClick={() => {
          showSelection("Currency");
        }}
      >
        Currency
      </FilterButton>
      <FilterButton
        RightBtn={Plus}
        onClick={() => {
          showSelection("Status");
        }}
      >
        Status
      </FilterButton>
      <FilterButton
        RightBtn={ChevronDown}
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
