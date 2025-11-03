import Select from "react-select/creatable";
import React, { useMemo } from "react";
import {
  ClearIndicatorProps,
  ContainerProps,
  ControlProps,
  DropdownIndicatorProps,
  IndicatorsContainerProps,
  InputProps,
  MenuListProps,
  MenuProps,
  OptionProps,
  PlaceholderProps,
  SingleValueProps,
  ValueContainerProps,
  components,
} from "react-select";
import omit from "lodash-es/omit";
import { useWallet } from "lib/state/wallet";
import { X } from "react-feather";
import { isValidPolkadotAddress, shortenAddress } from "lib/util";
import Avatar from "./Avatar";

export type AddressOption = {
  label?: string;
  value: string;
  name?: string;
};

const Control = ({ children, ...rest }: ControlProps<AddressOption, false>) => {
  return (
    <components.Control
      {...rest}
      className="flex h-full items-center justify-between pl-4 text-white"
    >
      {children}
    </components.Control>
  );
};

const IndicatorsContainer = ({
  children,
  ...rest
}: IndicatorsContainerProps<AddressOption, false>) => {
  return (
    <components.IndicatorsContainer {...rest} className="pr-4">
      {children}
    </components.IndicatorsContainer>
  );
};

const DropdownIndicator = (_: DropdownIndicatorProps<AddressOption, false>) => {
  return <></>;
};

const ClearIndicator = (props: ClearIndicatorProps<AddressOption, false>) => {
  return (
    <components.ClearIndicator
      {...omit(props, "children")}
      className="cursor-pointer text-white/70 hover:text-white transition-colors"
    >
      <X size={16} />
    </components.ClearIndicator>
  );
};

const Placeholder = (props: PlaceholderProps<AddressOption, false>) => {
  return (
    <components.Placeholder
      {...props}
      className="text-white/50"
    >
      {props.children}
    </components.Placeholder>
  );
};

const Menu = (props: MenuProps<AddressOption, false>) => {
  return (
    <components.Menu {...props} className="!z-[9999]">
      {props.children}
    </components.Menu>
  );
};

const MenuList = (props: MenuListProps<AddressOption, false>) => {
  return (
    <components.MenuList
      {...props}
      className="!absolute mt-1 !w-full rounded-lg border-2 border-white/20 bg-white/20 p-1.5 shadow-xl backdrop-blur-md"
    >
      {props.children}
    </components.MenuList>
  );
};

const SelectContainer = (props: ContainerProps<AddressOption, false>) => {
  return (
    <components.SelectContainer {...omit(props, "children")}>
      {props.children}
    </components.SelectContainer>
  );
};

const ValueContainer = (props: ValueContainerProps<AddressOption, false>) => {
  return (
    <components.ValueContainer
      {...omit(props, "children")}
      className="!flex h-full items-center"
    >
      {props.children}
    </components.ValueContainer>
  );
};

const SingleValue = ({
  children,
  ...rest
}: SingleValueProps<AddressOption, false>) => {
  const address = rest.data.value;
  const isValidAddress = isValidPolkadotAddress(address);
  if (
    typeof children === "string" &&
    !children.includes(".") &&
    isValidAddress
  ) {
    children = shortenAddress(children, 13, 13);
  }

  return (
    <components.SingleValue
      {...rest}
      className="flex items-center font-medium text-white"
    >
      {isValidAddress && (
        <div
          className={`center mr-3 h-9 w-9 rounded-full bg-transparent transition-opacity ${
            rest.selectProps.menuIsOpen && "opacity-50"
          }`}
        >
          <Avatar address={address} size={36} />
        </div>
      )}
      <div
        className={`flex flex-col transition-opacity text-white ${
          rest.selectProps.menuIsOpen && "opacity-50"
        }`}
      >
        {rest.data.name && <div className="text-xs text-white/70">{rest.data.name}</div>}
        <div className="text-white/90">{children}</div>
      </div>
    </components.SingleValue>
  );
};

const Option = ({ children, ...rest }: OptionProps<AddressOption, false>) => {
  const { value: address, label, name } = rest.data;
  const { isFocused, isSelected } = rest;
  return (
    <components.Option
      {...rest}
      className={`mb-2 !flex h-14 w-full !cursor-pointer items-center rounded-md px-4 transition-all last:mb-0 ${
        isSelected
          ? "bg-ztg-green-500/20 text-ztg-green-400"
          : isFocused
            ? "bg-white/15 text-white"
            : "bg-white/5 text-white/90 hover:bg-white/15 hover:text-white"
      }`}
    >
      {isValidPolkadotAddress(address) && (
        <div className="center mr-3 h-9 w-9 rounded-full bg-transparent">
          <Avatar address={address} size={36} />
        </div>
      )}
      <div className="flex flex-col">
        {name && <div className="text-xs">{name}</div>}
        <div>{label}</div>
      </div>
    </components.Option>
  );
};

const Input = (props: InputProps<AddressOption, false>) => {
  return (
    <components.Input
      {...props}
      className="absolute left-0 w-full text-white placeholder:text-white/50"
    />
  );
};

export type AddressInputProps = {
  onChange: (option: AddressOption | null) => void;
  value?: AddressOption | null;
  error?: string;
  options?: AddressOption[];
  disabled?: boolean;
};

const AddressInput: React.FC<AddressInputProps> = ({
  onChange,
  error,
  value = null,
  options,
  disabled = false,
}) => {
  const wallet = useWallet();

  const opts = useMemo<AddressOption[]>(() => {
    if (options) {
      return options;
    }
    return wallet.accounts
      .filter((acc) => acc.address !== wallet.activeAccount?.address)
      .map((account) => ({
        label: shortenAddress(account.address, 13, 13),
        value: account.address,
        name: account.name,
      }));
  }, [options, wallet.accounts]);

  return (
    <div>
      <div
        className={
          "relative h-14 w-full rounded-md border-2 transition-colors " +
          (error
            ? "border-ztg-red-500"
            : "border-white/10 hover:border-white/20") +
          " bg-white/10 backdrop-blur-md"
        }
      >
        <Select
          className="h-full"
          isSearchable={true}
          isClearable={true}
          options={opts}
          unstyled={true}
          placeholder="Enter account address"
          isMulti={false}
          value={value}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
          menuPosition="fixed"
          components={{
            Control,
            IndicatorsContainer,
            SelectContainer,
            DropdownIndicator,
            ClearIndicator,
            Menu,
            MenuList,
            ValueContainer,
            Option,
            SingleValue,
            Input,
            Placeholder,
          }}
          styles={{
            menuPortal: (base: any) => ({
              ...base,
              zIndex: 9999,
            }),
          }}
          onChange={onChange}
        />
        {disabled && (
          <div className="absolute top-0 h-full w-full bg-ztg-primary-500/80 backdrop-blur-sm rounded-md" />
        )}
      </div>
      {error && (
        <div className="text-right text-sm text-ztg-red-400 mt-1 mb-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
