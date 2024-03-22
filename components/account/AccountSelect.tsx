import { useWallet } from "lib/state/wallet";

import React, { FC } from "react";
import Select, {
  components,
  ControlProps,
  OnChangeValue,
  OptionProps,
  SingleValueProps,
  StylesConfig,
} from "react-select";

import CopyIcon from "../ui/CopyIcon";
import AccountSelectOption from "./AccountSelectOption";
import AccountSelectValue from "./AccountSelectValue";

export type AccountOption = { label: string; value: string };

const Control = ({ children, ...rest }: ControlProps<AccountOption, false>) => {
  return (
    <components.Control {...(rest as ControlProps)}>
      <div className="flex cursor-pointer items-center justify-between rounded-ztg-10 bg-sky-100 dark:bg-black">
        {children}
      </div>
    </components.Control>
  );
};

const Option = (props: OptionProps<AccountOption, false>) => {
  const { label, value } = props.data;

  return (
    <components.Option {...props} className="bg-black">
      <AccountSelectOption name={label} address={value} />
    </components.Option>
  );
};

const SingleValue = (props: SingleValueProps<AccountOption, false>) => {
  return (
    <AccountSelectValue name={props.data.label} address={props.data.value} />
  );
};

const DropdownIndicator = () => {
  return null;
};

const IndicatorSeparator = () => {
  return <></>;
};

const customStyles: StylesConfig<AccountOption> = {
  valueContainer: () => {
    return {
      "input[readonly]": {
        display: "block",
      },
      height: "50px",
      width: "100%",
    };
  },
  control: () => {
    return {
      borderWidth: 0,
      outline: 0,
    };
  },
  option: () => {
    return {};
  },
  input: () => {
    return { height: 0 };
  },
  menu: (provided) => {
    return {
      ...provided,
      marginTop: "3px",
      marginBottom: 0,
      backgroundColor: "transparent",
    };
  },
};

export type AccountSelectProps = {
  options: AccountOption[];
  value: AccountOption | null;
  disabled?: boolean;
  onChange: (opt: OnChangeValue<AccountOption, false>) => void;
};

const AccountSelect: FC<AccountSelectProps> = ({
  options,
  value,
  disabled,
  onChange,
}) => {
  const wallet = useWallet();
  return (
    <div className="flex h-ztg-50 w-full items-center rounded-ztg-10 bg-sky-100 dark:bg-black">
      <div className="flex-1">
        <Select
          isSearchable={false}
          options={options}
          styles={customStyles}
          value={value}
          isMulti={false}
          isDisabled={disabled}
          placeholder="Select an account"
          components={{
            Control,
            Option,
            SingleValue,
            DropdownIndicator,
            IndicatorSeparator,
          }}
          onChange={onChange}
        />
      </div>

      {wallet.activeAccount?.address && (
        <CopyIcon
          copyText={wallet.activeAccount?.address}
          className="w-auto pr-ztg-8"
          size={16}
        />
      )}
    </div>
  );
};

export default AccountSelect;
