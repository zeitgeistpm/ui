import { observer } from "mobx-react";
import { useContext, useEffect, useRef, useState } from "react";
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
import Skeleton from "components/ui/Skeleton";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import MarketActiveFilters from "./MarketActiveFilters";
import MarketFiltersContainer, {
  MarketFiltersContext,
} from "./MarketFiltersContainer";
import DropDownSelect from "./DropDownSelect";
import MobileDialog from "./MobileDialog";

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

type MarketFilterOptionsProps = {
  addFilter: (filter: MarketFilter) => void;
  ordering: MarketsOrderBy;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  withLiquidityOnly: boolean;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
  className: string;
};

const MarketFilterOptions = ({
  addFilter,
  ordering,
  onOrderingChange,
  withLiquidityOnly,
  onWithLiquidityOnlyChange,
  className,
}: MarketFilterOptionsProps) => {
  const { selectedMenu, portal } = useContext(MarketFiltersContext);
  return (
    <div className={className}>
      <DropDownSelect
        label="Category"
        options={marketTagFilterOptions}
        add={addFilter}
        portal={portal}
        isOpen={selectedMenu === "Category"}
      />
      <div className="w-[1px] h-[10px] bg-pastel-blue"></div>
      <DropDownSelect
        label="Currency"
        options={marketCurrencyFilterOptions}
        add={addFilter}
        portal={portal}
        isOpen={selectedMenu === "Currency"}
      />
      <div className="w-[1px] h-[10px] bg-pastel-blue"></div>
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        add={addFilter}
        portal={portal}
        isOpen={selectedMenu === "Status"}
      />
      <div className="w-[1px] h-[10px] bg-pastel-blue"></div>
      {withLiquidityOnly != null && (
        <label className="text-black font-medium mr-[20px] ml-[20px]">
          <input
            className="mr-[10px]"
            type="checkbox"
            checked={withLiquidityOnly}
            onChange={(e) => onWithLiquidityOnlyChange(e.target.checked)}
          />
          Liquidity only
        </label>
      )}
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
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();
  const portalRef = useRef<HTMLDivElement>(null);

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
    <MarketFiltersContainer
      activeFilters={activeFilters}
      portal={portalRef.current}
    >
      <MobileDialog></MobileDialog>
      <div className="w-full flex flex-col items-center justify-center mb-[30px]">
        {portalRef.current ? (
          <MarketFilterOptions
            addFilter={add}
            onOrderingChange={setActiveOrdering}
            ordering={activeOrdering}
            withLiquidityOnly={withLiquidityOnly}
            onWithLiquidityOnlyChange={setWithLiquidityOnly}
            className="flex items-center gap-ztg-5 mb-[25px]"
          />
        ) : (
          <Skeleton width="80%" height="44px" className="mb-[25px]"></Skeleton>
        )}
        <div id="marketsFiltersMenuPortal" ref={portalRef}></div>
        <MarketActiveFilters
          filters={activeFilters}
          onClear={clear}
          onFilterRemove={remove}
          className="flex gap-2"
        />
      </div>
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
