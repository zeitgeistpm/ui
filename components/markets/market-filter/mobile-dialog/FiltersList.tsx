import { PropsWithChildren } from "react";
import { Icon, Plus, ChevronDown, ChevronUp } from "react-feather";
import MarketActiveFilters from "../MarketActiveFilters";
import MarketFiltersCheckboxes from "../MarketFiltersCheckboxes";
import { SelectionType } from "./types";
import MarketFiltersSort from "../MarketFiltersSort";

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
  dropdownIndicator: (provided) => {
    return {
      ...provided,
      display: "none",
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

const IndicatorSeparator = (props) => {
  const { menuIsOpen } = props.selectProps;
  return menuIsOpen ? <ChevronUp /> : <ChevronDown />;
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
        "flex items-center h-10 border-b border-gray-200 box-content mb-5 " +
        className
      }
      onClick={onClick}
    >
      {children}
      {RightIcon && <RightIcon className="ml-auto" size={24} />}
    </div>
  );
};

export type FiltersListProps = {
  showSelection: (type: SelectionType) => void;
  close: () => void;
};

const FiltersList = ({ showSelection, close }: FiltersListProps) => {
  return (
    <>
      <MarketActiveFilters className="flex flex-row w-full justify-center gap-2 flex-wrap mb-5 " />
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showSelection("Category");
        }}
        className="cursor-pointer"
      >
        Category
      </FilterButton>
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showSelection("Currency");
        }}
        className="cursor-pointer"
      >
        Currency
      </FilterButton>
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showSelection("Status");
        }}
        className="cursor-pointer"
      >
        Status
      </FilterButton>
      <FilterButton>
        <div className="flex items-center flex-grow">
          <div style={{ minWidth: "62px" }}>Sort By:</div>
          <MarketFiltersSort
            className="w-full"
            selectStyles={sortBySelectStyles}
            components={{ IndicatorSeparator }}
          />
        </div>
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
