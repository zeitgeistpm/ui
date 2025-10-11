import { MarketFilter } from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "react-feather";
import ReactSelect, {
  components,
  ControlProps,
  MenuListProps,
  OptionProps,
} from "react-select";
import { useMarketFiltersContext } from "./MarketFiltersContainer";

const Control = ({ children, ...props }: ControlProps<MarketFilter, false>) => {
  const { setSelectedMenu, selectedMenu } = useMarketFiltersContext();
  const { menuIsOpen, selectProps } = props;
  const Chevron = menuIsOpen ? ChevronUp : ChevronDown;

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
          "flex h-7 items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-all lg:px-2.5 " +
          (menuIsOpen
            ? "bg-sky-100 text-sky-800"
            : "text-sky-800 hover:bg-sky-50 hover:text-sky-800")
        }
        onClick={onClick}
      >
        <span className="cursor-pointer">{selectProps.placeholder}</span>
        <Chevron size={14} className="ml-1 cursor-pointer lg:ml-1.5" />
        {children}
      </div>
    </components.Control>
  );
};

const Option = ({ children, ...props }: OptionProps<MarketFilter, false>) => {
  const { data } = props;

  const { activeFilters } = useMarketFiltersContext();

  const isActive = findFilterIndex(activeFilters, data) !== -1;

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-md px-1.5 py-1 shadow-sm transition-all " +
          (isActive
            ? "bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md"
            : "bg-white hover:bg-sky-50 hover:shadow-md")
        }
      >
        {data.imageUrl && (
          <div className="center mr-1 h-7 w-7 overflow-hidden rounded-md bg-white p-0.5 shadow-sm">
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
        <div
          className={
            "px-1.5 text-xs font-medium " +
            (isActive ? "text-white" : "text-sky-800")
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

const customStyles = {
  menu: (provided) => {
    return {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      padding: "4px",
      border: "1px solid #E0F2FE",
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
    return { width: "100%" };
  },
  valueContainer: () => {
    return {};
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
      className="mr-1.5 lg:mr-[10px]"
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
