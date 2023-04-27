import { marketsOrderByOptions } from "lib/constants/market-filter";
import { MarketsOrderBy } from "lib/types/market-filter";
import { observer } from "mobx-react";
import React from "react";
import ReactSelect from "react-select";

type MarketFilterSortProps = {
  ordering: MarketsOrderBy;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  className?: string;
};

const sortBySelectStyles = {
  control: (provided) => {
    return {
      ...provided,
      width: "180px",
      height: "32px",
      minHeight: "32px",
      fontSize: "14px",
    };
  },
  dropdownIndicator: (provided) => {
    return {
      ...provided,
      padding: "0px",
      paddingRight: "10px",
    };
  },
  singleValue: (provided) => {
    return {
      ...provided,
    };
  },
  valueContainer: (provided) => {
    return {
      ...provided,
      paddingLeft: "10px",
    };
  },
  input: (provided) => {
    return {
      ...provided,
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

const IndicatorSeparator = () => {
  return <></>;
};

const SortBySelect = observer(
  ({
    onOrderingChange,
    ordering,
  }: {
    ordering: MarketsOrderBy;
    onOrderingChange: (v: MarketsOrderBy) => void;
  }) => {
    return (
      <ReactSelect
        value={marketsOrderByOptions.find((opt) => opt.value === ordering)}
        onChange={(v) => {
          onOrderingChange(v.value);
        }}
        options={marketsOrderByOptions}
        styles={sortBySelectStyles}
        components={{
          IndicatorSeparator,
        }}
      />
    );
  },
);

const MarketFilterSort: React.FC<MarketFilterSortProps> = ({
  ordering,
  onOrderingChange,
  className = "",
}) => {
  return (
    <div className={className}>
      <SortBySelect ordering={ordering} onOrderingChange={onOrderingChange} />
    </div>
  );
};

export default MarketFilterSort;
