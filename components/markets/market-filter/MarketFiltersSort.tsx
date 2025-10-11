import { marketsOrderByOptions } from "lib/constants/market-filter";
import { MarketOrderByOption, MarketsOrderBy } from "lib/types/market-filter";
import React from "react";
import ReactSelect, { GroupBase, StylesConfig } from "react-select";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import { SelectComponents } from "react-select/dist/declarations/src/components";

type MarketFilterSortProps = {
  className?: string;
  selectStyles?: StylesConfig<MarketOrderByOption, false>;
  components?: Partial<
    SelectComponents<MarketOrderByOption, false, GroupBase<MarketOrderByOption>>
  >;
};

const sortBySelectStyles = {
  control: (provided, state) => {
    return {
      ...provided,
      width: "160px",
      height: "30px",
      minHeight: "30px",
      fontSize: "13px",
      borderRadius: "6px",
      border: state.isFocused ? "1px solid #0EA5E9" : "1px solid #E0F2FE",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(14, 165, 233, 0.1)" : "none",
      backgroundColor: "white",
      transition: "all 0.2s",
      "&:hover": {
        borderColor: "#0EA5E9",
      },
    };
  },
  dropdownIndicator: (provided) => {
    return {
      ...provided,
      padding: "0px",
      paddingRight: "6px",
      color: "#0EA5E9",
    };
  },
  singleValue: (provided) => {
    return {
      ...provided,
      fontWeight: 600,
      color: "#075985",
      fontSize: "13px",
    };
  },
  valueContainer: (provided) => {
    return {
      ...provided,
      paddingLeft: "10px",
      padding: "0 10px",
    };
  },
  input: (provided) => {
    return {
      ...provided,
      margin: 0,
      padding: 0,
    };
  },
  menu: (provided) => {
    return {
      ...provided,
      backgroundColor: "white",
      borderRadius: "6px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      border: "1px solid #E0F2FE",
      zIndex: 100,
    };
  },
  option: (provided, state) => {
    return {
      ...provided,
      backgroundColor: state.isSelected
        ? "#0EA5E9"
        : state.isFocused
        ? "#F0F9FF"
        : "white",
      color: state.isSelected ? "white" : "#075985",
      fontWeight: state.isSelected ? 600 : 500,
      fontSize: "13px",
      padding: "6px 10px",
      "&:active": {
        backgroundColor: "#0EA5E9",
      },
    };
  },
};

const IndicatorSeparator = () => {
  return <></>;
};

const SortBySelect = ({
  onOrderingChange,
  ordering,
  styles,
  components,
}: {
  ordering: MarketsOrderBy;
  onOrderingChange: (v: MarketsOrderBy) => void;
  styles?: StylesConfig<MarketOrderByOption, false>;
  components?: Partial<
    SelectComponents<MarketOrderByOption, false, GroupBase<MarketOrderByOption>>
  >;
}) => {
  return (
    <ReactSelect
      value={marketsOrderByOptions.find((opt) => opt.value === ordering)}
      onChange={(v) => {
        if (v) onOrderingChange(v.value);
      }}
      options={marketsOrderByOptions}
      styles={{ ...sortBySelectStyles, ...(styles ?? {}) }}
      components={{
        IndicatorSeparator,
        ...(components ?? {}),
      }}
    />
  );
};

const MarketFilterSort: React.FC<MarketFilterSortProps> = ({
  className = "",
  selectStyles = {},
  components,
}) => {
  const { ordering, setOrdering } = useMarketFiltersContext();
  return (
    <div className={className}>
      <SortBySelect
        ordering={ordering}
        onOrderingChange={setOrdering}
        styles={selectStyles}
        components={components}
      />
    </div>
  );
};

export default MarketFilterSort;
