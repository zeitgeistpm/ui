import { MarketType } from "lib/types/market-filter";
import { Grid, Layers, ChevronDown, ChevronUp } from "react-feather";
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
  { value: "regular", label: "Single", icon: Grid },
  { value: "multi", label: "Multi", icon: Layers },
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
          "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 " +
          (menuIsOpen
            ? "bg-white/15 text-white"
            : selectedOption
              ? "bg-white/15 text-ztg-green-400 hover:bg-white/20 hover:text-white"
              : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white")
        }
        onClick={onClick}
      >
        <Icon size={14} className="cursor-pointer sm:h-4 sm:w-4" />
        <span className="cursor-pointer">
          {selectedOption?.label || "Markets"}
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
}: OptionProps<MarketTypeOption, false>) => {
  const { data, isSelected, isFocused } = props;
  const Icon = data.icon;

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-md px-2 py-1.5 transition-all " +
          (isSelected
            ? "bg-ztg-green-500/20 text-ztg-green-400"
            : isFocused
              ? "bg-white/10 text-white"
              : "text-white/90 hover:bg-white/10 hover:text-white")
        }
      >
        <Icon size={13} className={isSelected ? "text-ztg-green-400" : ""} />
        <div className="flex items-center gap-1.5">
          {isSelected && (
            <div className="h-1.5 w-1.5 rounded-full bg-ztg-green-400"></div>
          )}
          <div
            className={
              "px-1 text-xs font-medium " +
              (isSelected ? "text-ztg-green-400" : "inherit")
            }
          >
            {data.label} Market
          </div>
        </div>
      </div>
    </components.Option>
  );
};

const MenuList = ({ children, ...props }: MenuListProps<MarketTypeOption, false>) => {
  return (
    <components.MenuList {...props}>
      <div className="mx-auto flex flex-row flex-wrap gap-1.5">{children}</div>
    </components.MenuList>
  );
};

const Input = (props: InputProps<MarketTypeOption, false>) => {
  return (
    <components.Input
      {...props}
      className="!pointer-events-none !absolute !m-0 !h-0 !w-0 !p-0 !opacity-0"
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
        width: 0,
        height: 0,
        margin: 0,
        padding: 0,
      }}
    />
  );
};

const ValueContainer = (
  props: ValueContainerProps<MarketTypeOption, false>,
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

const customStyles: StylesConfig<MarketTypeOption, false> = {
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
  );
};

export default MarketTypeToggle;
