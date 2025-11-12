import { marketsOrderByOptions } from "lib/constants/market-filter";
import { MarketOrderByOption, MarketsOrderBy } from "lib/types/market-filter";
import React from "react";
import ReactSelect, {
  components,
  ControlProps,
  InputProps,
  MenuListProps,
  OptionProps,
  StylesConfig,
  ValueContainerProps,
} from "react-select";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  Clock,
  TrendingUp,
  TrendingDown,
} from "react-feather";

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
  const isVolumeBased =
    selectedOption?.value === MarketsOrderBy.MostVolume ||
    selectedOption?.value === MarketsOrderBy.LeastVolume;

  let Icon:
    | typeof Clock
    | typeof BarChart2
    | typeof TrendingUp
    | typeof TrendingDown = BarChart2;
  if (isTimeBased) {
    Icon = Clock;
  } else if (selectedOption?.value === MarketsOrderBy.MostVolume) {
    Icon = TrendingUp;
  } else if (selectedOption?.value === MarketsOrderBy.LeastVolume) {
    Icon = TrendingDown;
  }

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
          "flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 " +
          (menuIsOpen
            ? "bg-white/15 text-white"
            : selectedOption
              ? "bg-white/15 text-ztg-green-500 hover:bg-white/20 hover:text-white"
              : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white")
        }
        onClick={onClick}
      >
        <Icon size={14} className="cursor-pointer sm:h-4 sm:w-4" />
        <span className="cursor-pointer">
          {isVolumeBased ? "Volume" : selectedOption?.label || "Sort"}
        </span>
        <Chevron
          size={14}
          className="cursor-pointer transition-transform sm:h-4 sm:w-4"
        />
        <div className="!pointer-events-none !absolute !m-0 !h-0 !w-0 !p-0 !opacity-0">
          {children}
        </div>
      </div>
    </components.Control>
  );
};

const Option = ({
  children,
  ...props
}: OptionProps<MarketOrderByOption, false>) => {
  const { isSelected, data, isFocused } = props;

  // Determine icon based on sort type
  const isTimeBased =
    data.value === MarketsOrderBy.Newest ||
    data.value === MarketsOrderBy.Oldest;
  const isVolumeBased =
    data.value === MarketsOrderBy.MostVolume ||
    data.value === MarketsOrderBy.LeastVolume;

  let Icon:
    | typeof Clock
    | typeof BarChart2
    | typeof TrendingUp
    | typeof TrendingDown = BarChart2;
  if (isTimeBased) {
    Icon = Clock;
  } else if (data.value === MarketsOrderBy.MostVolume) {
    Icon = TrendingUp;
  } else if (data.value === MarketsOrderBy.LeastVolume) {
    Icon = TrendingDown;
  }

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-md px-2 py-1.5 transition-all " +
          (isSelected
            ? "bg-ztg-green-500/20 text-ztg-green-500"
            : isFocused
              ? "bg-white/10 text-white"
              : "text-white/90 hover:bg-white/10 hover:text-white")
        }
      >
        <Icon size={13} className={isSelected ? "text-ztg-green-500" : ""} />
        <div className="flex items-center gap-1.5">
          {isSelected && (
            <div className="h-1.5 w-1.5 rounded-full bg-ztg-green-400"></div>
          )}
          <div
            className={
              "px-1 text-xs font-medium " +
              (isSelected ? "text-ztg-green-500" : "inherit")
            }
          >
            {isVolumeBased ? "Volume" : children}
          </div>
        </div>
      </div>
    </components.Option>
  );
};

const MenuList = ({ children, ...props }: MenuListProps) => {
  return (
    <components.MenuList {...props}>
      <div className="mx-auto flex flex-row flex-wrap gap-1.5">{children}</div>
    </components.MenuList>
  );
};

const Input = (props: InputProps<MarketOrderByOption, false>) => {
  return (
    <components.Input
      {...props}
      className="!pointer-events-none !absolute !m-0 !h-0 !w-0 !p-0 !opacity-0"
    />
  );
};

const ValueContainer = (
  props: ValueContainerProps<MarketOrderByOption, false>,
) => {
  return (
    <components.ValueContainer
      {...props}
      className="!pointer-events-none !absolute !m-0 !h-0 !w-0 !p-0 !opacity-0"
    />
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

const customStyles: StylesConfig<MarketOrderByOption, false> = {
  menu: () => {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(12px)",
      borderRadius: "8px",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      padding: "8px",
      border: "2px solid rgba(34, 181, 122, 0.4)",
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
          Input,
          ValueContainer,
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
