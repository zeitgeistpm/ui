import { MarketFilter } from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import { observer } from "mobx-react";
import { useContext, useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "react-feather";
import ReactSelect, {
  ControlProps,
  components,
  OptionProps,
  MenuListProps,
} from "react-select";
import { MarketFiltersContext } from "./MarketFiltersContainer";
import Image from "next/image";

const Control = ({ children, ...props }: ControlProps<MarketFilter, false>) => {
  const { setSelectedMenu, selectedMenu } = useContext(MarketFiltersContext);
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
          "flex justify-center items-center ml-[10px] font-medium text-ztg-16-150 h-[44px] " +
          (menuIsOpen ? "text-black" : "text-sky-600")
        }
        onClick={onClick}
      >
        <span className="cursor-pointer">{selectProps.placeholder}</span>
        <Chevron size={18} className="ml-ztg-8 font-bold cursor-pointer" />
        {children}
      </div>
    </components.Control>
  );
};

const Option = ({ children, ...props }: OptionProps<MarketFilter>) => {
  const { data } = props;

  const { activeFilters } = useContext(MarketFiltersContext);

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
          <div className="h-[47px] w-[47px] rounded-full mr-[6px] bg-border-dark overflow-hidden center">
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
            "pr-[10px] pl-[10px] " + (isActive ? "text-white" : "text-black")
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
      <div className="flex flex-row flex-wrap mx-auto gap-[12px] justify-center mb-[30px]">
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
  add,
  portal,
  isOpen = false,
}: {
  label: string;
  options: MarketFilter[];
  portal: HTMLDivElement;
  isOpen?: boolean;
  add: (val: MarketFilter) => void;
}) => {
  return (
    <ReactSelect
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
        add(val);
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
