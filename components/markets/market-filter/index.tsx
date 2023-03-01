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
  categoryImages,
  currencyImages,
  filterTypes,
  marketCurrencyFilterOptions,
  marketsOrderByOptions,
  marketStatusFilterOptions,
  marketTagFilterOptions,
} from "lib/constants/market-filter";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import MarketActiveFilters from "./MarketActiveFilters";
import MarketFiltersContainer, {
  ActiveFiltersContext,
} from "./MarketFiltersContainer";

const Control = ({ children, ...props }: ControlProps<MarketFilter, false>) => {
  const { innerProps, menuIsOpen, selectProps } = props;
  const { onMouseDown } = innerProps;

  const Chevron = menuIsOpen ? ChevronUp : ChevronDown;
  return (
    <components.Control {...props}>
      <div
        className={
          "flex justify-center items-center pl-ztg-20 font-medium text-ztg-16-150 h-ztg-44 " +
          (menuIsOpen ? "text-black" : "text-sky-600")
        }
        onMouseDown={onMouseDown}
      >
        <span className="cursor-pointer">{selectProps.placeholder}</span>
        <Chevron size={18} className="ml-ztg-8 font-bold cursor-pointer" />
        {children}
      </div>
    </components.Control>
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

const Option = ({ children, ...props }: OptionProps<MarketFilter>) => {
  const { data } = props;

  const activeFilters = useContext(ActiveFiltersContext);

  const isActive = findFilterIndex(activeFilters, data) !== -1;

  const imageUrl = (() => {
    if (data.type === "tag") {
      const item = categoryImages.find((cat) => cat.name === data.value);
      return item?.imagePath;
    } else if (data.type === "currency") {
      const item = currencyImages.find(
        (cat) => cat.name.toLowerCase() === data.value.toLowerCase(),
      );
      return item?.imagePath;
    }
  })();

  const showIcon = data.type === "tag" || data.type === "currency";

  return (
    <components.Option {...props}>
      <div
        className={
          "center h-full cursor-pointer rounded-full px-[5px] " +
          (isActive ? "bg-fog-of-war" : "bg-platinum")
        }
      >
        {showIcon && (
          <div className="h-[47px] w-[47px] rounded-full mr-[6px] bg-border-dark overflow-hidden center">
            {imageUrl && (
              <Image
                className="rounded-full"
                src={imageUrl}
                alt={`icon-${data.value.toLowerCase()}`}
                width={48}
                height={48}
              />
            )}
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
    const portal = document.getElementById("marketsFiltersMenuPortal");

    return (
      <ReactSelect
        placeholder={label}
        options={options}
        styles={customStyles}
        isMulti={false}
        isSearchable={false}
        menuPortalTarget={portal}
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
      width: "130px",
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
      // lineHeight: "32px",
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
    <div className="flex items-center gap-ztg-5 mb-[25px]">
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
      <label className="text-black font-medium mr-[25px]">
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
        add={add}
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
