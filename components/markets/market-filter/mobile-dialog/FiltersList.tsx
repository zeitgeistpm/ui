import { PropsWithChildren } from "react";
import { Icon, Plus, ChevronDown, ChevronUp } from "react-feather";
import MarketActiveFilters from "../MarketActiveFilters";
import MarketFiltersCheckboxes from "../MarketFiltersCheckboxes";
import { SelectedMenu } from "../MarketFiltersContainer";
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
        "mb-5 box-content flex h-10 items-center border-b border-gray-200 " +
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
  showMenu: (menu: SelectedMenu) => void;
  close: () => void;
};

const FiltersList = ({ showMenu, close }: FiltersListProps) => {
  return (
    <>
      <MarketActiveFilters className="mb-5 flex w-full flex-row flex-wrap justify-center gap-2 " />
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showMenu("Category");
        }}
        className="cursor-pointer"
      >
        Category
      </FilterButton>
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showMenu("Currency");
        }}
        className="cursor-pointer"
      >
        Currency
      </FilterButton>
      <FilterButton
        RightIcon={Plus}
        onClick={() => {
          showMenu("Status");
        }}
        className="cursor-pointer"
      >
        Status
      </FilterButton>
      <FilterButton>
        <div className="flex flex-grow items-center">
          <div style={{ minWidth: "62px" }}>Sort By:</div>
          <MarketFiltersSort
            className="w-full"
            selectStyles={sortBySelectStyles}
            components={{ IndicatorsContainer }}
          />
        </div>
      </FilterButton>
      <MarketFiltersCheckboxes className="mt-4" />
      <button
        className="mt-auto h-14 rounded-full bg-ztg-blue text-white"
        onClick={close}
      >
        Show Markets
      </button>
    </>
  );
};

export default FiltersList;
