import { AssetId, ZTG } from "@zeitgeistpm/sdk-next";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized } from "lib/util";
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
} from "react-select";

export type AssetOption = {
  label: string;
  value: AssetId;
  image: string;
};

const Control = ({ children, ...rest }: ControlProps<AssetOption, false>) => {
  return (
    <components.Control
      {...rest}
      className="flex items-center justify-between !cursor-pointer h-full pl-4"
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

const SingleValue = (props: SingleValueProps<AssetOption, false>) => {
  const { label, image } = props.data;
  return (
    <div className="flex items-center font-semibold">
      <img src={image} className="w-9 h-9 mr-3" />
      <span>{label}</span>
    </div>
  );
};

const Option = (props: OptionProps<AssetOption, false>) => {
  const { label, value, image } = props.data;
  const wallet = useWallet();
  const address = wallet.activeAccount?.address;

  const { data: balance } = useBalance(address, value);

  return (
    <components.Option
      {...props}
      className="!flex items-center w-full bg-anti-flash-white rounded-md h-14 mb-2 last:mb-0 font-semibold px-4 !cursor-pointer"
    >
      <img src={image} className="w-9 h-9 mr-3" />
      <span>{label}</span>
      {balance && (
        <div className="ml-auto text-xs">
          Balance: {formatNumberLocalized(balance.div(ZTG).toNumber())}
        </div>
      )}
    </components.Option>
  );
};

const MenuList = (props: MenuListProps<AssetOption, false>) => {
  return (
    <components.MenuList
      {...props}
      className="!w-full bg-white mt-1 pt-1 rounded-md"
    >
      {props.children}
    </components.MenuList>
  );
};

export type AssetSelectProps = {
  options: AssetOption[];
  selectedOption?: AssetOption;
  onChange: (value: AssetOption) => void;
};

const AssetSelect: React.FC<AssetSelectProps> = ({
  options,
  selectedOption,
  onChange,
}) => {
  return (
    <Select
      className="w-34 h-full !static"
      isSearchable={false}
      options={options}
      unstyled={true}
      value={selectedOption}
      placeholder="Select"
      isMulti={false}
      components={{
        Control,
        ValueContainer,
        SelectContainer,
        Option,
        SingleValue,
        MenuList,
      }}
      onChange={onChange}
    />
  );
};

export default AssetSelect;
