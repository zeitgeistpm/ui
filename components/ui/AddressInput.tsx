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
  OptionProps,
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
      className="flex h-full items-center justify-between pl-4"
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
      className="cursor-pointer"
    >
      <X />
    </components.ClearIndicator>
  );
};

const MenuList = (props: MenuListProps<AddressOption, false>) => {
  return (
    <components.MenuList
      {...props}
      className="!absolute mt-1 !w-full rounded-md bg-white"
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
    <components.SingleValue {...rest} className="flex items-center font-medium">
      {isValidAddress && (
        <div
          className={`center mr-3 h-9 w-9 rounded-full bg-transparent transition-opacity ${
            rest.selectProps.menuIsOpen && "opacity-5"
          }`}
        >
          <Avatar address={address} size={36} />
        </div>
      )}
      <div
        className={`flex flex-col transition-opacity ${
          rest.selectProps.menuIsOpen && "opacity-5"
        }`}
      >
        <div className="text-xs">{rest.data.name}</div>
        {children}
      </div>
    </components.SingleValue>
  );
};

const Option = ({ children, ...rest }: OptionProps<AddressOption, false>) => {
  const { value: address, label, name } = rest.data;
  return (
    <components.Option
      {...rest}
      className="mb-2 !flex h-14 w-full !cursor-pointer items-center rounded-md bg-anti-flash-white px-4 last:mb-0"
    >
      {isValidPolkadotAddress(address) && (
        <div className="center mr-3 h-9 w-9 rounded-full bg-transparent">
          <Avatar address={address} size={36} />
        </div>
      )}
      <div className="flex flex-col">
        <div className="text-xs">{name}</div>
        <div>{label}</div>
      </div>
    </components.Option>
  );
};

const Input = (props: InputProps<AddressOption, false>) => {
  return <components.Input {...props} className="absolute left-0 w-full" />;
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
    <div
      className={
        "relative mb-5 h-14 w-full rounded-md border-1 border-transparent bg-anti-flash-white " +
        (error ? "border-vermilion" : "")
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
        components={{
          Control,
          IndicatorsContainer,
          SelectContainer,
          DropdownIndicator,
          ClearIndicator,
          MenuList,
          ValueContainer,
          Option,
          SingleValue,
          Input,
        }}
        onChange={onChange}
      />
      {disabled && (
        <div className="absolute top-0 h-full w-full bg-white opacity-50" />
      )}
      {error && (
        <div className="text-right text-sm text-vermilion">{error}</div>
      )}
    </div>
  );
};

export default AddressInput;
