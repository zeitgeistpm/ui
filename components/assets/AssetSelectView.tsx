import { OutcomeOption } from "lib/stores/ExchangeStore";
import { observer } from "mobx-react";
import React, { FC } from "react";
import { ArrowLeft, Search } from "react-feather";
import ReactSelect from "react-select";

const Control = ({ children, ...rest }) => {
  const { innerProps } = rest;
  const { onMouseDown } = innerProps;
  return (
    <div className="flex px-ztg-16" onMouseDown={onMouseDown}>
      {children}
    </div>
  );
};

const Menu = (props) => {
  const { children } = props;
  return <div className="bg-transparent">{children}</div>;
};

const ValueContainer = ({ children }) => {
  return <div className="flex h-ztg-40 w-full mb-ztg-12">{children}</div>;
};

const cleanCommonProps = (props: any): any => {
  const {
    className,
    clearValue,
    cx,
    getStyles,
    getValue,
    hasValue,
    isMulti,
    isRtl,
    options,
    selectOption,
    selectProps,
    setValue,
    theme,
    ...innerProps
  } = props;
  return { ...innerProps };
};

const Input = (props) => {
  const { innerRef, isDisabled, isHidden, onBlur, ...innerProps } =
    cleanCommonProps(props);

  return (
    <div className="flex h-ztg-40 p-ztg-8 w-full rounded-ztg-5 bg-sky-200 dark:bg-black">
      <Search size={24} className="text-sky-600 mr-ztg-10" />
      <input
        {...innerProps}
        type="text"
        ref={innerRef}
        onBlur={() => {}}
        placeholder="Search by Name"
        className="bg-transparent focus:outline-none text-sky-600 font-lato text-ztg-14-120"
      />
    </div>
  );
};

const SingleValue = (props) => {
  return <></>;
};

const DropdownIndicator = () => {
  return <></>;
};

const IndicatorSeparator = () => {
  return <></>;
};

const IndicatorsContainer = ({ children }) => {
  return <>{children}</>;
};

const Option = observer(({ innerProps, label, data, isSelected }) => {
  const { color, marketSlug, balance } = data;

  const baseClass =
    "h-ztg-62 px-ztg-16 flex flex-col cursor-pointer pb-ztg-5 mb-ztg-5 dark:hover:bg-sky-700 hover:bg-sky-100";

  return (
    <div
      className={`${baseClass} ${
        isSelected ? "bg-sky-200 dark:bg-black" : "bg-transparent"
      }`}
      {...innerProps}
    >
      <div className="h-ztg-15 font-lato font-bold text-ztg-10-150 flex items-center text-sky-600 mt-ztg-5 uppercase">
        {marketSlug}
      </div>
      <div className="flex h-ztg-36 items-center">
        <div
          className="h-ztg-20 w-ztg-20 border-2 border-sky-600 rounded-full mr-ztg-8"
          style={{ background: `${color}` }}
        ></div>
        <div className="font-space h-ztg-20 flex items-center font-bold dark:text-white">
          {label}
        </div>
        <div className="h-ztg-20 flex items-center font-mono text-ztg-12-120 ml-auto text-sky-600">
          {balance || "--"}
        </div>
      </div>
    </div>
  );
});

export interface AssetSelectViewProps {
  onBack: () => void;
  options: OutcomeOption[];
  selectedOption: OutcomeOption;
  onOptionChange: (option: OutcomeOption) => void;
}

const customStyles = {
  menuList: (provided) => {
    return {
      ...provided,
      minHeight: "335px",
      background: "transparent",
    };
  },
};

const filterOptions = (candidate, input) => {
  const label: string = candidate.label;
  if (input) {
    return label.toLowerCase().includes(input.toLowerCase());
  }
  return true;
};

const AssetSelectView: FC<AssetSelectViewProps> = ({
  onBack,
  options,
  selectedOption,
  onOptionChange,
}) => {
  return (
    <>
      <div
        className="cursor-pointer flex items-center h-ztg-25 my-ztg-6 px-ztg-16"
        onClick={() => onBack()}
      >
        <ArrowLeft size={16} className="mr-ztg-10 text-sky-600" />
        <div className="font-space text-ztg-14-150 text-sky-600 font-bold">
          Select Token
        </div>
      </div>
      <ReactSelect
        styles={customStyles}
        menuIsOpen={true}
        options={options}
        onChange={(opt: OutcomeOption) => {
          onOptionChange(opt);
          onBack();
        }}
        value={selectedOption}
        filterOption={filterOptions}
        components={{
          Control,
          SingleValue,
          ValueContainer,
          DropdownIndicator,
          IndicatorSeparator,
          IndicatorsContainer,
          Option,
          Input,
          Menu,
        }}
      />
    </>
  );
};

export default AssetSelectView;
