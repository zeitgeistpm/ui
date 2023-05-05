import { marketsOrderByOptions } from "lib/constants/market-filter";
import { MarketOrderByOption, MarketsOrderBy } from "lib/types/market-filter";
import { observer } from "mobx-react";
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
    styles,
    components,
  }: {
    ordering: MarketsOrderBy;
    onOrderingChange: (v: MarketsOrderBy) => void;
    styles?: StylesConfig<MarketOrderByOption, false>;
    components?: Partial<
      SelectComponents<
        MarketOrderByOption,
        false,
        GroupBase<MarketOrderByOption>
      >
    >;
  }) => {
    return (
      <ReactSelect
        value={marketsOrderByOptions.find((opt) => opt.value === ordering)}
        onChange={(v) => {
          onOrderingChange(v.value);
        }}
        options={marketsOrderByOptions}
        styles={{ ...sortBySelectStyles, ...(styles ?? {}) }}
        components={{
          IndicatorSeparator,
          ...(components ?? {}),
        }}
      />
    );
  },
);

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
