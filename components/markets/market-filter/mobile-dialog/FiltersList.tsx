import { PropsWithChildren } from "react";
import {
  Icon,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "react-feather";
import MarketActiveFilters from "../MarketActiveFilters";
import MarketFiltersCheckboxes from "../MarketFiltersCheckboxes";
import { SelectedMenu } from "../MarketFiltersContainer";
import MarketFiltersSort from "../MarketFiltersSort";
import MarketTypeToggle from "../MarketTypeToggle";
import { MarketType } from "lib/types/market-filter";

const sortBySelectStyles = {
  container: (provided) => {
    return { ...provided, borderColor: "transparent" };
  },
  control: (provided) => {
    return {
      ...provided,
      width: "100%",
      height: "32px",
      minHeight: "32px",
      fontSize: "16px",
      borderColor: "transparent",
      "&:hover": {
        borderColor: "transparent",
      },
      boxShadow: "none",
      cursor: "pointer",
    };
  },
  singleValue: (provided) => {
    return {
      ...provided,
    };
  },
  valueContainer: (provided) => {
    return {
      ...provided,
      padding: "0px",
    };
  },
  input: (provided) => {
    return {
      ...provided,
      padding: "0px",
      margin: "0px",
    };
  },
  menu: (provided) => {
    return {
      ...provided,
      backgroundColor: "white",
      color: "black",
      zIndex: 100,
      width: "100%",
    };
  },
};

const IndicatorsContainer = (props) => {
  const { menuIsOpen } = props.selectProps;
  return menuIsOpen ? (
    <ChevronUp className="pointer-events-none" />
  ) : (
    <ChevronDown className="pointer-events-none" />
  );
};

type FilterButtonProps = PropsWithChildren<{
  RightIcon?: Icon;
  onClick?: () => void;
  className?: string;
}>;

const FilterButton = ({
  children,
  RightIcon,
  onClick = () => {},
  className = "",
}: FilterButtonProps) => {
  return (
    <div
      className={
        "mb-3 flex h-12 items-center rounded-lg bg-white px-4 shadow-sm transition-all hover:shadow-md " +
        className
      }
      onClick={onClick}
    >
      <div className="text-sm font-semibold text-gray-700">{children}</div>
      {RightIcon && <RightIcon className="ml-auto text-sky-600" size={20} />}
    </div>
  );
};

export type FiltersListProps = {
  showMenu: (menu: SelectedMenu) => void;
  close: () => void;
  marketType?: MarketType;
  onMarketTypeChange?: (type: MarketType) => void;
};

const FiltersList = ({
  showMenu,
  close,
  marketType = "regular",
  onMarketTypeChange,
}: FiltersListProps) => {
  return (
    <>
      {/* Market Type Section */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Market Type
        </div>
        <div className="flex justify-center rounded-lg bg-white p-3 shadow-sm">
          <MarketTypeToggle
            value={marketType}
            onChange={onMarketTypeChange || (() => {})}
          />
        </div>
      </div>

      {/* Active Filters */}
      <MarketActiveFilters className="mb-4 flex w-full flex-row flex-wrap justify-start gap-1.5" />

      {/* Filter Options */}
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Filter By
      </div>
      <FilterButton
        RightIcon={ChevronRight}
        onClick={() => {
          showMenu("Category");
        }}
        className="cursor-pointer"
      >
        Category
      </FilterButton>
      <FilterButton
        RightIcon={ChevronRight}
        onClick={() => {
          showMenu("Currency");
        }}
        className="cursor-pointer"
      >
        Currency
      </FilterButton>
      <FilterButton
        RightIcon={ChevronRight}
        onClick={() => {
          showMenu("Status");
        }}
        className="cursor-pointer"
      >
        Status
      </FilterButton>

      {/* Sort By Section */}
      <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Sort By
      </div>
      <div className="mb-3 flex items-center rounded-lg bg-white px-4 py-3 shadow-sm">
        <MarketFiltersSort
          className="w-full"
          selectStyles={sortBySelectStyles}
          components={{ IndicatorsContainer }}
        />
      </div>

      {/* Liquidity Checkbox */}
      <div className="mb-4 rounded-lg bg-white px-4 py-3 shadow-sm">
        <MarketFiltersCheckboxes />
      </div>

      {/* Show Markets Button */}
      <button
        className="mt-auto h-12 rounded-lg bg-sky-600 text-sm font-semibold text-white shadow-md transition-all hover:bg-sky-700"
        onClick={close}
      >
        Show Markets
      </button>
    </>
  );
};

export default FiltersList;
