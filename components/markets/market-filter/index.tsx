import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { ChevronDown } from "react-feather";
import ReactSelect from "react-select";
import { MarketFilter, MarketsListQuery } from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import {
  filterTypes,
  marketCurrencyFilterOptions,
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
}: {
  onFiltersChange: (filters: MarketFilter[]) => void;
}) => {
  const [activeFilters, setActiveFilters] = useState<MarketFilter[]>();
  const queryState = useMarketsUrlQuery();

  const add = (filter: MarketFilter) => {
    if (findFilterIndex(activeFilters, filter) !== -1) return;

    const nextFilters = [...activeFilters, filter];

    const queryStateFilters = queryState.filters[filter.type];

    queryState.updateQuery({
      filters: {
        [filter.type]: [...queryStateFilters, filter.value],
      },
    });
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

    const filterValue = filter.value;

    const queryStateFilters = queryState.filters[filter.type];
    const queryStateFilterIdx = queryStateFilters.findIndex(
      (f) => f === filterValue,
    );

    queryState.updateQuery({
      filters: {
        [filter.type]: [
          ...queryStateFilters.slice(0, queryStateFilterIdx),
          ...queryStateFilters.slice(queryStateFilterIdx + 1),
        ],
      },
    });
    setActiveFilters(nextFilters);
  };

  useEffect(() => {
    if (activeFilters == null) {
      return;
    }

    onFiltersChange(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    if (queryState == null) {
      return;
    }
    const activeFilters = getFiltersFromQueryState(queryState);
    setActiveFilters(activeFilters);
  }, [queryState]);

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

export default MarketFilterSelection;
