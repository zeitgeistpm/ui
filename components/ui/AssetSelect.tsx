import { AssetId } from "@zeitgeistpm/sdk";
import Image from "next/image";
import omit from "lodash-es/omit";
import React from "react";
import Select, {
  components,
  ControlProps,
  OptionProps,
  SingleValueProps,
  ContainerProps,
  ValueContainerProps,
  MenuListProps,
  MenuProps,
  DropdownIndicatorProps,
} from "react-select";
import { ChevronDown, ChevronUp } from "react-feather";
import { lookupAssetOriginChain } from "lib/constants/foreign-asset";

export type AssetOption = {
  label: string;
  value?: AssetId;
  image?: string;
  additionalText?: string;
};

const DropdownIndicator = (
  props: DropdownIndicatorProps<AssetOption, false>,
) => {
  const Chevron = props.selectProps.menuIsOpen ? ChevronUp : ChevronDown;
  return (
    <components.DropdownIndicator {...props}>
      <Chevron
        size={14}
        className="mr-3 text-white/70 transition-transform"
      />
    </components.DropdownIndicator>
  );
};

const Control = ({ children, ...rest }: ControlProps<AssetOption, false>) => {
  return (
    <components.Control
      {...rest}
      className="flex h-full w-full !cursor-pointer items-center justify-between pl-3"
    >
      {children}
    </components.Control>
  );
};

const ValueContainer = (props: ValueContainerProps<AssetOption, false>) => {
  return (
    <components.ValueContainer {...omit(props, "children")} className="!flex">
      {props.children}
    </components.ValueContainer>
  );
};

const SelectContainer = (props: ContainerProps<AssetOption, false>) => {
  return (
    <components.SelectContainer {...omit(props, "children")}>
      {props.children}
    </components.SelectContainer>
  );
};

// Stable IndicatorSeparator component
const IndicatorSeparator = () => null;

const SingleValue = (props: SingleValueProps<AssetOption, false>) => {
  const { label, image, value } = props.data;
  return (
    <div className="flex items-center text-xs font-semibold text-white">
      {image ? (
        <Image
          src={image}
          width={24}
          height={24}
          className="mr-2 shrink-0"
          alt={label}
          quality={100}
        />
      ) : (
        <div className="mr-2 h-6 w-6 shrink-0 rounded-full bg-ztg-blue"></div>
      )}
      <span className="truncate">
        {label} ({lookupAssetOriginChain(value)})
      </span>
    </div>
  );
};

const Option = (props: OptionProps<AssetOption, false>) => {
  const { label, value, image, additionalText } = props.data;
  const { isFocused, isSelected } = props;

  // Memoize the origin chain lookup to prevent recalculations
  const originChain = React.useMemo(
    () => lookupAssetOriginChain(value),
    [value]
  );

  return (
    <components.Option
      {...props}
      className={`mb-1 !flex h-10 w-full !cursor-pointer items-center rounded-md px-3 text-xs font-medium transition-all last:mb-0 ${
        isSelected
          ? "bg-ztg-green-500/20 text-ztg-green-400"
          : isFocused
            ? "bg-white/15 text-white"
            : "bg-white/10 text-white/90 hover:bg-white/15 hover:text-white"
      }`}
    >
      {image ? (
        <Image
          src={image}
          width={24}
          height={24}
          className="mr-2 shrink-0"
          alt={label}
          quality={100}
        />
      ) : (
        <div className="mr-2 h-6 w-6 shrink-0 rounded-full bg-ztg-blue"></div>
      )}
      <span className="truncate flex-1 min-w-0">
        {label} ({originChain})
      </span>
      {additionalText && (
        <div className="ml-2 shrink-0 text-xs text-white/70">{additionalText}</div>
      )}
    </components.Option>
  );
};

const Menu = (props: MenuProps<AssetOption, false>) => {
  return (
    <components.Menu {...props} className="!z-[9999]">
      {props.children}
    </components.Menu>
  );
};

const MenuList = (props: MenuListProps<AssetOption, false>) => {
  return (
    <components.MenuList
      {...props}
      className="mt-1 !w-full rounded-lg border-2 border-white/10 bg-white/10 p-1.5 shadow-lg backdrop-blur-md"
    >
      {props.children}
    </components.MenuList>
  );
};

export type AssetSelectProps = {
  options: AssetOption[];
  selectedOption?: AssetOption;
  onChange: (value: AssetOption) => void;
  showArrowRight?: boolean;
  menuPortalTarget?: HTMLElement | null;
};

const AssetSelect: React.FC<AssetSelectProps> = ({
  options,
  selectedOption,
  onChange,
  showArrowRight = false,
  menuPortalTarget,
}) => {
  // Default to document.body if no portal target is provided to ensure menu renders
  // outside scrollable containers (like modals) to prevent positioning issues
  const portalTarget = React.useMemo(() => {
    if (menuPortalTarget) return menuPortalTarget;
    if (typeof document !== "undefined") return document.body;
    return undefined;
  }, [menuPortalTarget]);

  // Memoize components to prevent react-select from thinking components changed
  const components = React.useMemo(
    () => ({
      Control,
      ValueContainer,
      SelectContainer,
      Option,
      SingleValue,
      Menu,
      MenuList,
      DropdownIndicator,
      IndicatorSeparator,
    }),
    []
  );

  // Memoize styles to prevent recreating on every render
  const styles = React.useMemo(
    () => ({
      menu: (base: any) => ({
        ...base,
        zIndex: 9999,
        // Ensure menu matches the select width
        minWidth: base.minWidth || "auto",
      }),
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999,
      }),
    }),
    []
  );

  return (
    <Select
      instanceId="asset-select"
      className={`!static h-full ${showArrowRight ? "pr-4" : "w-fit"}`}
      isSearchable={false}
      options={options}
      unstyled={true}
      value={selectedOption}
      placeholder="Select"
      isMulti={false}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
      components={components}
      styles={styles}
      onChange={onChange}
    />
  );
};

export default AssetSelect;
