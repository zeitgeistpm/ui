import { observer } from "mobx-react";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "react-feather";
import ReactSelect, {
  components,
  ControlProps,
  MenuListProps,
  OptionProps,
} from "react-select";
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
import MarketActiveFilters from "./MarketActiveFilters";
import MarketFiltersContainer, {
  MarketFiltersContext,
} from "./MarketFiltersContainer";

const Control = ({ children, ...props }: ControlProps<MarketFilter, false>) => {
  const { setSelectedMenu, selectedMenu } = useContext(MarketFiltersContext);
  const { menuIsOpen, selectProps } = props;
  const Chevron = menuIsOpen ? ChevronUp : ChevronDown;

  const onClick = () => {
    if (selectedMenu === selectProps.placeholder) {
      setSelectedMenu("None");
    } else {
      setSelectedMenu(selectProps.placeholder as any);
    }
  };

  return (
    <components.Control {...props}>
      <div
        className={
          "flex justify-center items-center ml-[10px] font-medium text-ztg-16-150 h-[44px] " +
          (menuIsOpen ? "text-black" : "text-sky-600")
        }
        onClick={onClick}
      >
        <span className="cursor-pointer">{selectProps.placeholder}</span>
        <Chevron size={18} className="ml-ztg-8 font-bold cursor-pointer" />
        {children}
      </div>
    </components.Control>
  );
};

const Option = ({ children, ...props }: OptionProps<MarketFilter>) => {
  const { data } = props;

  const { activeFilters } = useContext(MarketFiltersContext);

  const isActive = findFilterIndex(activeFilters, data) !== -1;

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-full px-[5px] " +
          (isActive ? "bg-fog-of-war" : "bg-platinum")
        }
      >
        {data.imageUrl && (
          <div className="h-[47px] w-[47px] rounded-full mr-[6px] bg-border-dark overflow-hidden center">
            <Image
              className="rounded-full"
              src={data.imageUrl}
              alt={`icon-${data.value.toLowerCase()}`}
              width={48}
              height={48}
              quality={100}
            />
          </div>
        )}
        <div
          className={
            "pr-[10px] pl-[10px] " + (isActive ? "text-white" : "text-black")
          }
        >
          {children}
        </div>
      </div>
    </components.Option>
  );
};

const MenuList = ({ children, ...props }: MenuListProps) => {
  return (
    <components.MenuList {...props}>
      <div className="flex flex-row flex-wrap mx-auto gap-[12px] justify-center mb-[30px]">
        {children}
      </div>
    </components.MenuList>
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
      backgroundColor: "transparent",
      color: "black",
    };
  },
  menuList: (provided) => {
    return {};
  },
  option: (provided) => {
    return {
      display: "inline-block",
      height: "56px",
    };
  },
  control: () => {
    return {
      height: "100%",
    };
  },
  menuPortal: () => {
    return { width: "100%" };
  },
  valueContainer: () => {
    return {};
  },
};

const DropDownSelect = observer(
  ({
    label,
    options,
    add,
    isOpen = false,
  }: {
    label: string;
    options: MarketFilter[];
    isOpen?: boolean;
    add: (val: MarketFilter) => void;
  }) => {
    const portal = document.getElementById("marketsFiltersMenuPortal");

    return (
      <ReactSelect
        className="mr-[10px]"
        placeholder={label}
        options={options}
        styles={customStyles}
        isMulti={false}
        isSearchable={false}
        menuPortalTarget={portal}
        menuIsOpen={isOpen}
        onChange={(val: MarketFilter) => {
          add(val);
        }}
        components={{
          Control,
          SingleValue,
          IndicatorSeparator,
          DropdownIndicator,
          Placeholder,
          Option,
          MenuList,
        }}
      />
    );
  },
);

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
  addFilter: (filter: MarketFilter) => void;
  ordering: MarketsOrderBy;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  withLiquidityOnly: boolean;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
};

const MarketFilterOptions = ({
  addFilter,
  ordering,
  onOrderingChange,
  withLiquidityOnly,
  onWithLiquidityOnlyChange,
}: MarketFilterOptionsProps) => {
  const { selectedMenu } = useContext(MarketFiltersContext);
  return (
    <div className="flex items-center gap-ztg-5 mb-[25px]">
      <DropDownSelect
        label="Category"
        options={marketTagFilterOptions}
        add={addFilter}
        isOpen={selectedMenu === "Category"}
      />
      <div className="w-[1px] h-[10px] bg-pastel-blue"></div>
      <DropDownSelect
        label="Currency"
        options={marketCurrencyFilterOptions}
        add={addFilter}
        isOpen={selectedMenu === "Currency"}
      />
      <div className="w-[1px] h-[10px] bg-pastel-blue"></div>
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        add={addFilter}
        isOpen={selectedMenu === "Status"}
      />
      <div className="w-[1px] h-[10px] bg-pastel-blue"></div>
      <label className="text-black font-medium mr-[20px] ml-[20px]">
        <input
          className="mr-[10px]"
          type="checkbox"
          checked={withLiquidityOnly}
          onChange={(e) => onWithLiquidityOnlyChange(e.target.checked)}
        />
        Liquidity only
      </label>
      <SortBySelect ordering={ordering} onOrderingChange={onOrderingChange} />
    </div>
  );
};

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
    <MarketFiltersContainer activeFilters={activeFilters}>
      <MarketFilterOptions
        addFilter={add}
        onOrderingChange={setActiveOrdering}
        ordering={activeOrdering}
        withLiquidityOnly={withLiquidityOnly}
        onWithLiquidityOnlyChange={setWithLiquidityOnly}
      />
      <div id="marketsFiltersMenuPortal"></div>
      <MarketActiveFilters
        filters={activeFilters}
        onClear={clear}
        onFilterRemove={remove}
      />
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
