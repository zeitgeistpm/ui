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
};

const Control = ({ children, ...rest }: ControlProps<AddressOption, false>) => {
  return (
    <components.Control
      {...rest}
      className="flex items-center justify-between h-full pl-4"
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
      className="!w-full !absolute bg-white mt-1 rounded-md"
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
      className="!flex items-center h-full"
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
        <div className="w-9 h-9 mr-3 bg-transparent rounded-full center">
          <Avatar address={address} size={36} />
        </div>
      )}
      {children}
    </components.SingleValue>
  );
};

const Option = ({ children, ...rest }: OptionProps<AddressOption, false>) => {
  const { value: address, label } = rest.data;
  return (
    <components.Option
      {...rest}
      className="!flex items-center w-full h-14 px-4 !cursor-pointer bg-anti-flash-white rounded-md mb-2 last:mb-0"
    >
      {isValidPolkadotAddress(address) && (
        <div className="w-9 h-9 mr-3 bg-transparent rounded-full center">
          <Avatar address={address} size={36} />
        </div>
      )}
      <div>{label}</div>
    </components.Option>
  );
};

const Input = (props: InputProps<AddressOption, false>) => {
  return <components.Input {...props} className="absolute w-full left-0" />;
};

export type AddressSelectProps = {
  onChange: (option: AddressOption | null) => void;
  value?: AddressOption | null;
  error?: string;
  options?: AddressOption[];
  disabled?: boolean;
};

const AddressInput: React.FC<AddressSelectProps> = ({
  onChange,
  error,
  value = null,
  options,
  disabled = false,
}) => {
  const wallet = useWallet();

  const opts = useMemo<AddressOption[]>(() => {
    if (options) {
      console.log("options", options);
      return options;
    }
    return wallet.accounts
      .filter((acc) => acc.address !== wallet.activeAccount?.address)
      .map((account) => ({
        label: shortenAddress(account.address, 13, 13),
        value: account.address,
      }));
  }, [options, wallet.accounts]);

  return (
    <div
      className={
        "mb-5 h-14 w-full bg-anti-flash-white rounded-md border-1 border-transparent relative " +
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
        <div className="absolute w-full h-full bg-white opacity-50 top-0" />
      )}
      {error && (
        <div className="text-vermilion text-sm text-right">{error}</div>
      )}
    </div>
  );
};

export default AddressInput;
