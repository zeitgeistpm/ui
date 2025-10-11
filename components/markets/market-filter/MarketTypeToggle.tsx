import { MarketType } from "lib/types/market-filter";
import { Grid, Layers, ChevronDown, ChevronUp } from "react-feather";
import ReactSelect, {
  components,
  ControlProps,
  MenuListProps,
  OptionProps,
} from "react-select";
import { useMarketFiltersContext } from "./MarketFiltersContainer";

export interface MarketTypeToggleProps {
  value: MarketType;
  onChange: (type: MarketType) => void;
}

type MarketTypeOption = {
  value: MarketType;
  label: string;
  icon: typeof Grid;
};

const marketTypeOptions: MarketTypeOption[] = [
  { value: "regular", label: "Single Markets", icon: Grid },
  { value: "multi", label: "Multi-Markets", icon: Layers },
];

const Control = ({
  children,
  ...props
}: ControlProps<MarketTypeOption, false>) => {
  const { setSelectedMenu, selectedMenu } = useMarketFiltersContext();
  const { menuIsOpen, selectProps } = props;
  const Chevron = menuIsOpen ? ChevronUp : ChevronDown;
  const selectedOption = selectProps.value as MarketTypeOption;
  const Icon = selectedOption?.icon || Grid;

  const onClick = () => {
    if (selectedMenu === "MarketType") {
      setSelectedMenu("None");
    } else {
      setSelectedMenu("MarketType" as any);
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
          {selectedOption?.label || "Markets"}
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
}: OptionProps<MarketTypeOption, false>) => {
  const { data, isSelected } = props;
  const Icon = data.icon;

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

const MarketTypeToggle = ({ value, onChange }: MarketTypeToggleProps) => {
  const { portal, selectedMenu, setSelectedMenu } = useMarketFiltersContext();
  const selectedOption = marketTypeOptions.find((opt) => opt.value === value);

  return (
    <ReactSelect<MarketTypeOption>
      className="mr-1 lg:mr-1.5"
      value={selectedOption}
      options={marketTypeOptions}
      styles={customStyles}
      isMulti={false}
      isSearchable={false}
      menuPortalTarget={portal}
      instanceId="market-type-select"
      menuIsOpen={selectedMenu === ("MarketType" as any)}
      onChange={(val: MarketTypeOption | null) => {
        if (val) {
          onChange(val.value);
          // Close menu after selection (toggle behavior)
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
  );
};

export default MarketTypeToggle;
