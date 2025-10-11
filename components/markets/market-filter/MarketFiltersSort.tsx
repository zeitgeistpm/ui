import { marketsOrderByOptions } from "lib/constants/market-filter";
import { MarketOrderByOption, MarketsOrderBy } from "lib/types/market-filter";
import React from "react";
import ReactSelect, {
  components,
  ControlProps,
  MenuListProps,
  OptionProps,
} from "react-select";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import { ChevronDown, ChevronUp, BarChart2, Clock } from "react-feather";

type MarketFilterSortProps = {
  className?: string;
};

const Control = ({
  children,
  ...props
}: ControlProps<MarketOrderByOption, false>) => {
  const { setSelectedMenu, selectedMenu } = useMarketFiltersContext();
  const { menuIsOpen, selectProps } = props;
  const Chevron = menuIsOpen ? ChevronUp : ChevronDown;
  const selectedOption = selectProps.value as MarketOrderByOption;

  // Determine icon based on selected sort type
  const isTimeBased =
    selectedOption?.value === MarketsOrderBy.Newest ||
    selectedOption?.value === MarketsOrderBy.Oldest;
  const Icon = isTimeBased ? Clock : BarChart2;

  const onClick = () => {
    if (selectedMenu === "Sort") {
      setSelectedMenu("None");
    } else {
      setSelectedMenu("Sort" as any);
    }
  };

  return (
    <components.Control {...props}>
      <div
        className={
          "flex h-7 items-center justify-center gap-1 rounded-lg px-1.5 text-sm font-semibold transition-all lg:gap-1.5 lg:px-2 " +
          (menuIsOpen
            ? "bg-sky-100 text-sky-800"
            : "text-sky-800 hover:bg-sky-50 hover:text-sky-800")
        }
        onClick={onClick}
      >
        <Icon size={13} className="cursor-pointer" />
        <span className="cursor-pointer">
          {selectedOption?.label || "Sort"}
        </span>
        <Chevron size={13} className="ml-0.5 cursor-pointer" />
        {children}
      </div>
    </components.Control>
  );
};

const Option = ({
  children,
  ...props
}: OptionProps<MarketOrderByOption, false>) => {
  const { isSelected, data } = props;

  // Determine icon based on sort type
  const isTimeBased =
    data.value === MarketsOrderBy.Newest ||
    data.value === MarketsOrderBy.Oldest;
  const Icon = isTimeBased ? Clock : BarChart2;

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-md px-1.5 py-1 shadow-sm transition-all " +
          (isSelected
            ? "bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md"
            : "bg-white hover:bg-sky-50 hover:shadow-md")
        }
      >
        <Icon size={13} />
        <div
          className={
            "px-1.5 text-xs font-medium " +
            (isSelected ? "text-white" : "text-sky-800")
          }
        >
          {children}
        </div>
      </div>
    </components.Option>
  );
};

const MenuList = ({ children, ...props }: MenuListProps) => {
  return (
    <components.MenuList {...props}>
      <div className="mx-auto mb-0.5 flex flex-row flex-wrap gap-1.5">
        {children}
      </div>
    </components.MenuList>
  );
};

const SingleValue = () => {
  return <></>;
};

const IndicatorSeparator = () => {
  return <></>;
};

const DropdownIndicator = () => {
  return <></>;
};

const Placeholder = () => {
  return <></>;
};

const customStyles = {
  menu: () => {
    return {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      padding: "4px",
      border: "1px solid #E0F2FE",
    };
  },
  menuList: () => {
    return {};
  },
  option: () => {
    return {
      display: "inline-block",
      height: "34px",
    };
  },
  control: () => {
    return {
      height: "100%",
    };
  },
  menuPortal: () => {
    return { width: "100%", zIndex: 50 };
  },
  valueContainer: () => {
    return {};
  },
};

const MarketFilterSort: React.FC<MarketFilterSortProps> = ({
  className = "",
}) => {
  const { ordering, setOrdering, portal, selectedMenu, setSelectedMenu } =
    useMarketFiltersContext();

  return (
    <div className={className}>
      <ReactSelect<MarketOrderByOption>
        className="mr-1 lg:mr-1.5"
        value={marketsOrderByOptions.find((opt) => opt.value === ordering)}
        options={marketsOrderByOptions}
        styles={customStyles}
        isMulti={false}
        isSearchable={false}
        menuPortalTarget={portal}
        instanceId="sort-select"
        menuIsOpen={selectedMenu === ("Sort" as any)}
        onChange={(val: MarketOrderByOption | null) => {
          if (val) {
            setOrdering(val.value);
            setSelectedMenu("None");
          }
        }}
        captureMenuScroll={false}
        components={{
          Control,
          SingleValue,
          IndicatorSeparator,
          DropdownIndicator,
          Placeholder,
          Option,
          MenuList,
        }}
      />
    </div>
  );
};

export default MarketFilterSort;
