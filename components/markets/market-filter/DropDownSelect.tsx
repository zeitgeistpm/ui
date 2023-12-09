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
          "flex h-8 items-center justify-center text-ztg-16-150 font-medium " +
          (menuIsOpen ? "text-black" : "text-sky-600")
        }
        onClick={onClick}
      >
        <span className="cursor-pointer">{selectProps.placeholder}</span>
        <Chevron size={18} className="ml-ztg-8 cursor-pointer font-bold" />
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
          "center h-full cursor-pointer rounded-full px-[5px] " +
          (isActive ? "bg-fog-of-war" : "bg-platinum")
        }
      >
        {data.imageUrl && (
          <div className="center mr-[6px] h-[47px] w-[47px] overflow-hidden rounded-full bg-white p-1">
            <Image
              className="rounded-full"
              src={data.imageUrl}
              alt={`icon-${data.value.toLowerCase()}`}
              width={48}
              height={48}
              quality={100}
            />
          </div>
        )}
        <div
          className={
            "pl-[10px] pr-[10px] " + (isActive ? "text-white" : "text-black")
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
      <div className="mx-auto mb-2 flex flex-row flex-wrap gap-[12px]">
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
      backgroundColor: "transparent",
      color: "black",
    };
  },
  menuList: (provided) => {
    return {};
  },
  option: (provided) => {
    return {
      display: "inline-block",
      height: "56px",
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
      className="mr-[10px]"
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
