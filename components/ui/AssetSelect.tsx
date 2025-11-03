import { AssetId, ZTG } from "@zeitgeistpm/sdk";
import Image from "next/image";
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
import { lookupAssetOriginChain } from "lib/constants/foreign-asset";

export type AssetOption = {
  label: string;
  value?: AssetId;
  image?: string;
  additionalText?: string;
};

const Control = ({ children, ...rest }: ControlProps<AssetOption, false>) => {
  return (
    <components.Control
      {...rest}
      className="flex h-full w-full !cursor-pointer items-center justify-between pl-4"
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
  const { label, image, value } = props.data;
  return (
    <div className="flex items-center font-semibold">
      {image ? (
        <Image
          src={image}
          width={36}
          height={36}
          className="mr-3"
          alt={label}
          quality={100}
        />
      ) : (
        <div className="mr-3 h-[36px] w-[36px] rounded-full bg-ztg-blue"></div>
      )}
      <span>
        {label} ({lookupAssetOriginChain(value)})
      </span>
    </div>
  );
};

const Option = (props: OptionProps<AssetOption, false>) => {
  const { label, value, image, additionalText } = props.data;
  const wallet = useWallet();
  const address = wallet.activeAccount?.address;

  const { data: balance } = useBalance(address, value);

  return (
    <components.Option
      {...props}
      className="mb-2 !flex h-14 w-full !cursor-pointer items-center rounded-md bg-anti-flash-white px-4 font-semibold last:mb-0"
    >
      {image ? (
        <Image
          src={image}
          width={36}
          height={36}
          className="mr-3"
          alt={label}
          quality={100}
        />
      ) : (
        <div className="mr-3 h-[36px] w-[36px] rounded-full bg-ztg-blue"></div>
      )}
      <span>
        {label} ({lookupAssetOriginChain(value)})
      </span>
      {balance && (
        <div className="ml-auto text-xs">
          Balance: {formatNumberLocalized(balance.div(ZTG).toNumber())}
        </div>
      )}
      {additionalText && (
        <div className="ml-auto text-xs">{additionalText}</div>
      )}
    </components.Option>
  );
};

const MenuList = (props: MenuListProps<AssetOption, false>) => {
  return (
    <components.MenuList
      {...props}
      className="mt-1 !w-full rounded-md bg-white/10 backdrop-blur-md shadow-xl pt-1"
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
};

const AssetSelect: React.FC<AssetSelectProps> = ({
  options,
  selectedOption,
  onChange,
  showArrowRight = false,
}) => {
  return (
    <Select
      className={`!static h-full ${showArrowRight ? "pr-4" : "w-fit"}`}
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
