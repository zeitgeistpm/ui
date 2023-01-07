import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { ChevronDown } from "react-feather";
import ReactSelect from "react-select";
import {
  MarketFilter,
  MarketsListQuery,
  MarketsOrderBy,
} from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import {
  filterTypes,
  marketCurrencyFilterOptions,
  marketsOrderByOptions,
  marketStatusFilterOptions,
  marketTagFilterOptions,
} from "lib/constants/market-filter";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import { MarketActiveFilters } from "./active-filters";

const Control = ({ children, label, ...rest }) => {
  const { innerProps } = rest;
  const { onMouseDown } = innerProps;
  return (
    <div
      className="flex justify-center items-center pl-ztg-20  font-medium text-ztg-16-150 text-sky-600 h-ztg-44"
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

type MarketFilterOptionsProps = {
  add: (filter: MarketFilter) => void;
  ordering: MarketsOrderBy;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  withLiquidityOnly: boolean;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
};

const MarketFilterOptions = ({
  add,
  ordering,
  onOrderingChange,
  withLiquidityOnly,
  onWithLiquidityOnlyChange,
}: MarketFilterOptionsProps) => {
  return (
    <div className="w-full flex justify-end items-center gap-ztg-5">
      <label className="text-sky-600 font-medium">
        Liquidity only
        <input
          className="ml-[10px]"
          type="checkbox"
          checked={withLiquidityOnly}
          onChange={(e) => onWithLiquidityOnlyChange(e.target.checked)}
        />
      </label>
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
      <SortBySelect ordering={ordering} onOrderingChange={onOrderingChange} />
    </div>
  );
};

const MarketFilterContainer = observer(({ children }) => {
  return <div className="w-full flex flex-col mb-[30px]">{children}</div>;
});

const getFiltersFromQueryState = (
  queryState: MarketsListQuery,
): MarketFilter[] => {
  let res: MarketFilter[] = [];
  if (queryState == null) {
    return res;
  }
  for (const filterType of filterTypes) {
    const queryStateFilters = queryState.filters[filterType];
    if (queryStateFilters == null) {
      continue;
    }
    res = [
      ...res,
      ...[
        ...queryStateFilters.map((qsf) => ({
          type: filterType,
          value: qsf,
          label: qsf,
        })),
      ],
    ];
  }
  return res;
};

const MarketFilterSelection = ({
  onFiltersChange,
  onOrderingChange,
  onWithLiquidityOnlyChange,
}: {
  onFiltersChange: (filters: MarketFilter[]) => void;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
}) => {
  const [activeFilters, setActiveFilters] = useState<MarketFilter[]>();
  const [activeOrdering, setActiveOrdering] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>(false);
  const queryState = useMarketsUrlQuery();

  const add = (filter: MarketFilter) => {
    if (findFilterIndex(activeFilters, filter) !== -1) return;

    const nextFilters = [...activeFilters, filter];

    setActiveFilters(nextFilters);
  };

  const clear = () => {
    queryState.updateQuery({
      filters: {
        status: [],
        tag: [],
        currency: [],
      },
    });
    setActiveFilters([]);
  };

  const remove = (filter: MarketFilter) => {
    const idx = findFilterIndex(activeFilters, filter);
    const nextFilters = [
      ...activeFilters.slice(0, idx),
      ...activeFilters.slice(idx + 1),
    ];

    setActiveFilters(nextFilters);
  };

  useEffect(() => {
    if (activeFilters == null) {
      return;
    }

    onFiltersChange(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    onWithLiquidityOnlyChange(withLiquidityOnly);
  }, [withLiquidityOnly]);

  useEffect(() => {
    if (activeOrdering == null) {
      return;
    }
    onOrderingChange(activeOrdering);
  }, [activeOrdering]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (queryState && !initialized) {
      const filters = getFiltersFromQueryState(queryState);
      const ordering = queryState.ordering;
      const liqudityOnly = queryState.liquidityOnly;
      setActiveFilters(filters);
      setActiveOrdering(ordering);
      setWithLiquidityOnly(liqudityOnly);
      setInitialized(true);
    }
  }, [queryState]);

  return (
    <MarketFilterContainer>
      <MarketFilterOptions
        add={add}
        onOrderingChange={setActiveOrdering}
        ordering={activeOrdering}
        withLiquidityOnly={withLiquidityOnly}
        onWithLiquidityOnlyChange={setWithLiquidityOnly}
      />
      <MarketActiveFilters
        filters={activeFilters}
        onClear={clear}
        onFilterRemove={remove}
      />
    </MarketFilterContainer>
  );
};

export default MarketFilterSelection;
