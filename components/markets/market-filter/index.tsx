import { observer } from "mobx-react";
import { useState } from "react";
import { ChevronDown } from "react-feather";
import ReactSelect from "react-select";
import { MarketFilter } from "lib/types/market-filter";
import { MarketActiveFilters } from "./active-filters";
import { findFilterIndex } from "lib/util/market-filter";
import {
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
  marketTagFilterOptions,
} from "lib/constants/market-filter";

const Control = ({ children, label, ...rest }) => {
  const { innerProps } = rest;
  const { onMouseDown } = innerProps;
  return (
    <div
      className="flex justify-center items-center pl-ztg-20 font-lato font-medium text-ztg-16-150 text-sky-600 h-ztg-44"
      onMouseDown={onMouseDown}
    >
      {label}
      <ChevronDown size={18} className="text-sky-600 ml-ztg-8 font-bold" />
      {children}
    </div>
  );
};

const SingleValue = (props) => {
  return <></>;
};

const IndicatorSeparator = () => {
  return <></>;
};

const DropdownIndicator = () => {
  return <></>;
};

const Placeholder = () => {
  return <></>;
};

const customStyles = {
  menu: (provided) => {
    return {
      ...provided,
      backgroundColor: "white",
      color: "black",
      zIndex: 100,
    };
  },
};

const DropDownSelect = observer(
  ({
    label,
    options,
    add,
  }: {
    label: string;
    options: MarketFilter[];
    add: (val: MarketFilter) => void;
  }) => {
    return (
      <ReactSelect
        options={options}
        styles={customStyles}
        isMulti={false}
        isSearchable={false}
        onChange={(val: MarketFilter) => {
          add(val);
        }}
        components={{
          Control: ({ children, ...rest }) => (
            <Control label={label} {...rest}>
              {children}
            </Control>
          ),
          SingleValue,
          IndicatorSeparator,
          DropdownIndicator,
          Placeholder,
        }}
      />
    );
  },
);

const filterOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-liquid", label: "Most Liquid" },
  { value: "least-liquid", label: "Least Liquid" },
  { value: "most-volume", label: "Most Volume" },
  { value: "least-volume", label: "Least Volume" },
];

const sortBySelectStyles = {
  control: (provided) => {
    return {
      ...provided,
      width: "220px",
    };
  },
  menu: (provided) => {
    return {
      ...provided,
      backgroundColor: "white",
      color: "black",
      zIndex: 100,
    };
  },
};

const SortBySelect = observer(() => {
  return (
    <ReactSelect
      options={filterOptions}
      styles={sortBySelectStyles}
      components={{
        IndicatorSeparator,
      }}
    />
  );
});

const MarketFilterOptions = ({
  add,
}: {
  add: (filter: MarketFilter) => void;
}) => {
  return (
    <div className="w-full flex justify-end items-center gap-ztg-5">
      <DropDownSelect
        label="Category"
        options={marketTagFilterOptions}
        add={add}
      />
      <DropDownSelect
        label="Currency"
        options={marketCurrencyFilterOptions}
        add={add}
      />
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        add={add}
      />
      <SortBySelect />
    </div>
  );
};

const MarketFilterContainer = observer(({ children }) => {
  return <div className="w-full flex flex-col">{children}</div>;
});

const MarketFilterSelect = ({
  initialFilters,
  onFiltersChange,
}: {
  initialFilters: MarketFilter[];
  onFiltersChange: (filters: MarketFilter[]) => void;
}) => {
  const [activeFilters, setActiveFilters] =
    useState<MarketFilter[]>(initialFilters);

  const add = (filter: MarketFilter) => {
    if (findFilterIndex(activeFilters, filter) !== -1) return;

    const nextFilters = [...activeFilters, filter];
    setActiveFilters(nextFilters);
    onFiltersChange(nextFilters);
  };

  const clear = () => {
    setActiveFilters([]);
    onFiltersChange([]);
  };

  const remove = (item: MarketFilter) => {
    const idx = findFilterIndex(activeFilters, item);
    const nextFilters = [
      ...activeFilters.slice(0, idx),
      ...activeFilters.slice(idx + 1, activeFilters.length),
    ];
    setActiveFilters(nextFilters);
    onFiltersChange(nextFilters);
  };

  return (
    <MarketFilterContainer>
      <MarketFilterOptions add={add} />
      <MarketActiveFilters
        filters={activeFilters}
        onClear={clear}
        onFilterRemove={remove}
      />
    </MarketFilterContainer>
  );
};

export default MarketFilterSelect;
