import { useWallet } from "lib/state/wallet";

import React, { FC } from "react";
import Select, {
  components,
  ControlProps,
  MenuListProps,
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
      <div className="flex cursor-pointer items-center rounded-lg">
        {children}
      </div>
    </components.Control>
  );
};

const Option = (props: OptionProps<AccountOption, false>) => {
  const { label, value } = props.data;
  return (
    <components.Option {...props}>
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
  return null;
};

const MenuList = (props: MenuListProps<AccountOption, false>) => {
  return (
    <div className="rounded-lg border-2 border-white/10 bg-ztg-primary-700/95 p-2 shadow-lg backdrop-blur-lg ring-2 ring-white/5">
      <components.MenuList {...props}>{props.children}</components.MenuList>
    </div>
  );
};

const customStyles: StylesConfig<AccountOption> = {
  valueContainer: () => {
    return {
      "input[readonly]": {
        display: "block",
      },
      height: "44px",
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
      marginTop: "8px",
      backgroundColor: "transparent",
    };
  },
  menuPortal: (provided) => {
    return {
      ...provided,
      zIndex: 9999,
    };
  },
  menuList: () => {
    return {
      padding: 0,
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
    <div className="flex w-full items-center gap-2">
      <div className="flex-1 cursor-pointer rounded-lg border-2 border-white/10 bg-white/10 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/20">
        <Select
          isSearchable={false}
          options={options}
          styles={customStyles}
          value={value}
          isMulti={false}
          isDisabled={disabled}
          placeholder="Select an account"
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          components={{
            Control,
            Option,
            SingleValue,
            DropdownIndicator,
            IndicatorSeparator,
            MenuList,
          }}
          onChange={onChange}
        />
      </div>
      {wallet.activeAccount?.address && (
        <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-white/10 bg-white/10 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/20">
          <CopyIcon copyText={wallet.activeAccount?.address} size={18} />
        </button>
      )}
    </div>
  );
};

export default AccountSelect;
