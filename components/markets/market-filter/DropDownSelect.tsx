import { MarketFilter } from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "react-feather";
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

const Control = ({ children, ...props }: ControlProps<MarketFilter, false>) => {
  const { setSelectedMenu, selectedMenu, activeFilters } =
    useMarketFiltersContext();
  const { menuIsOpen, selectProps } = props;
  const Chevron = menuIsOpen ? ChevronUp : ChevronDown;

  // Map label to filter type
  const labelToTypeMap: Record<string, string> = {
    Category: "tag",
    Currency: "currency",
    Status: "status",
  };

  const filterType =
    labelToTypeMap[String(selectProps.placeholder || "")] ||
    (typeof selectProps.placeholder === "string" ? selectProps.placeholder.toLowerCase() : "");
  const hasActiveFilters =
    activeFilters?.some((filter) => filter.type === filterType) ?? false;

  const onClick = () => {
    if (selectedMenu === selectProps.placeholder) {
      setSelectedMenu("None");
    } else {
      setSelectedMenu(selectProps.placeholder as any);
    }
  };

  return (
    <components.Control {...props}>
      <div
        className={
          "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 " +
          (menuIsOpen
            ? "bg-white/15 text-white"
            : hasActiveFilters
              ? "bg-white/15 text-ztg-green-400 hover:bg-white/20 hover:text-white"
              : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white")
        }
        onClick={onClick}
      >
        <span className="cursor-pointer">{selectProps.placeholder}</span>
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

const Option = ({ children, ...props }: OptionProps<MarketFilter, false>) => {
  const { data, isFocused } = props;

  const { activeFilters } = useMarketFiltersContext();

  const isActive = findFilterIndex(activeFilters, data) !== -1;

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-md px-2 py-1.5 transition-all " +
          (isActive
            ? "bg-ztg-green-500/20 text-ztg-green-400"
            : isFocused
              ? "bg-white/10 text-white"
              : "text-white/90 hover:bg-white/10 hover:text-white")
        }
      >
        {data.imageUrl && (
          <div className="center mr-1 h-7 w-7 overflow-hidden rounded-md bg-white/10 p-0.5 shadow-md backdrop-blur-sm">
            <Image
              className="rounded-md"
              src={data.imageUrl}
              alt={`icon-${data.value.toLowerCase()}`}
              width={28}
              height={28}
              quality={100}
            />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {isActive && (
            <div className="h-1.5 w-1.5 rounded-full bg-ztg-green-400"></div>
          )}
          <div
            className={
              "px-1 text-xs font-medium " +
              (isActive ? "text-ztg-green-400" : "inherit")
            }
          >
            {children}
          </div>
        </div>
      </div>
    </components.Option>
  );
};

const MenuList = ({ children, ...props }: MenuListProps<MarketFilter, false>) => {
  return (
    <components.MenuList {...props}>
      <div className="mx-auto flex flex-row flex-wrap gap-1.5">{children}</div>
    </components.MenuList>
  );
};

const Input = (props: InputProps<MarketFilter, false>) => {
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

const ValueContainer = (props: ValueContainerProps<MarketFilter, false>) => {
  return (
    <components.ValueContainer
      {...props}
      className="!pointer-events-none !absolute !m-0 !h-0 !w-0 !p-0 !opacity-0"
    />
  );
};

const SingleValue = (props) => {
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

const customStyles: StylesConfig<MarketFilter, false> = {
  menu: (provided) => {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(12px)",
      borderRadius: "8px",
      border: "2px solid rgba(34, 181, 122, 0.4)",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      padding: "8px",
    };
  },
  menuList: (provided) => {
    return {};
  },
  option: (provided) => {
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

const DropDownSelect = ({
  label,
  options,
  onChange,
  portal,
  isOpen = false,
}: {
  label: string;
  options: MarketFilter[];
  portal?: HTMLDivElement;
  isOpen?: boolean;
  onChange: (val: MarketFilter) => void;
}) => {
  return (
    <ReactSelect<MarketFilter>
      className="mr-1 lg:mr-1.5"
      placeholder={label}
      options={options}
      styles={customStyles}
      isMulti={false}
      isSearchable={false}
      menuPortalTarget={portal}
      instanceId={`${label}-select`}
      menuIsOpen={isOpen}
      onChange={(val: MarketFilter) => {
        onChange(val);
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

export default DropDownSelect;
