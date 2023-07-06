import { Unpacked } from "@zeitgeistpm/utility/dist/array";
import { useWallet } from "lib/state/wallet";

import React, { FC, useEffect, useMemo, useState } from "react";
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
import { useAccountModals } from "lib/state/account";

type AccountOption = { label: string; value: string };

const Control = ({ children, ...rest }: ControlProps<AccountOption, false>) => {
  return (
    <components.Control {...(rest as ControlProps)}>
      <div className="flex items-center bg-sky-100 dark:bg-black justify-between cursor-pointer rounded-ztg-10">
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

const AccountSelect: FC = () => {
  const wallet = useWallet();

  const options = useMemo<AccountOption[]>(() => {
    return wallet.accounts.map((account, id) => {
      return {
        label: account.name ?? `Account #${id}`,
        value: account.address,
      };
    });
  }, [wallet.accounts]);

  useEffect(() => {
    if (wallet.activeAccount) {
      const def = options.find(
        (o) => o.value === wallet.activeAccount?.address,
      );
      setDefaultOption(def);
    }
  }, [wallet.activeAccount, options]);

  const [defaultOption, setDefaultOption] = useState<AccountOption>();

  const onSelectChange = (
    opt: OnChangeValue<Unpacked<typeof options>, false>,
  ) => {
    opt && wallet.selectAccount(opt.value);
  };

  return (
    <div className="flex h-ztg-50 items-center bg-sky-100 dark:bg-black rounded-ztg-10 w-full">
      <Select
        isSearchable={false}
        options={options}
        styles={customStyles}
        value={defaultOption}
        isMulti={false}
        components={{
          Control,
          Option,
          SingleValue,
          DropdownIndicator,
          IndicatorSeparator,
        }}
        onChange={onSelectChange}
      />

      {wallet.activeAccount?.address && (
        <CopyIcon
          copyText={wallet.activeAccount.address}
          className="flex-grow pr-ztg-8"
          size={16}
        />
      )}
    </div>
  );
};

export default AccountSelect;
