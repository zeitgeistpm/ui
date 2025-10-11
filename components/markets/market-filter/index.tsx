import Skeleton from "components/ui/Skeleton";
import {
  filterTypes,
  marketCurrencyFilterOptions,
} from "lib/constants/market-filter";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import {
  MarketFilter,
  MarketsListQuery,
  MarketsOrderBy,
  MarketType,
} from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "react-feather";
import MarketActiveFilters from "./MarketActiveFilters";
import MarketFiltersCheckboxes from "./MarketFiltersCheckboxes";
import MarketFiltersContainer, { SelectedMenu } from "./MarketFiltersContainer";
import MarketFiltersDropdowns from "./MarketFiltersDropdowns";
import MarketFiltersSort from "./MarketFiltersSort";
import MobileDialog from "./mobile-dialog";
import MarketTypeToggle from "./MarketTypeToggle";

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
      ...queryStateFilters.map((qsf) => ({
        type: filterType,
        value: qsf,
        label:
          filterType === "currency"
            ? (marketCurrencyFilterOptions.find((v) => v.value === qsf)
                ?.label as string)
            : qsf,
      })),
    ];
  }
  return res;
};

const convertFiltersToQueryFormat = (filters: MarketFilter[]) => {
  const result: { status: string[]; tag: string[]; currency: string[] } = {
    status: [],
    tag: [],
    currency: [],
  };

  for (const filter of filters) {
    result[filter.type].push(filter.value);
  }

  return result;
};

const MarketFilterSelection = ({
  onFiltersChange,
  onOrderingChange,
  onWithLiquidityOnlyChange,
  onMarketTypeChange,
}: {
  onFiltersChange: (filters: MarketFilter[]) => void;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
  onMarketTypeChange: (marketType: MarketType) => void;
}) => {
  const [activeFilters, setActiveFilters] = useState<MarketFilter[]>();
  const [activeOrdering, setActiveOrdering] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();
  const [marketType, setMarketType] = useState<MarketType>();
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  const [selectedMenu, setSelectedMenu] = useState<SelectedMenu>("None");

  const queryState = useMarketsUrlQuery();

  const add = (filter: MarketFilter) => {
    const currentFilters = getFiltersFromQueryState(queryState);

    if (findFilterIndex(currentFilters, filter) !== -1) return;
    const nextFilters = [...currentFilters, filter];

    queryState.updateQuery({
      filters: convertFiltersToQueryFormat(nextFilters),
    });
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
    const currentFilters = getFiltersFromQueryState(queryState);
    const idx = findFilterIndex(currentFilters, filter);

    if (idx === -1) return;

    const nextFilters = [
      ...currentFilters.slice(0, idx),
      ...currentFilters.slice(idx + 1),
    ];

    queryState.updateQuery({
      filters: convertFiltersToQueryFormat(nextFilters),
    });
  };

  const updateOrdering = (ordering: MarketsOrderBy) => {
    queryState.updateQuery({
      ordering,
    });
  };

  const updateLiquidityOnly = (liquidityOnly: boolean) => {
    queryState.updateQuery({
      liquidityOnly,
    });
  };

  const updateMarketType = (marketType: MarketType) => {
    queryState.updateQuery({
      marketType,
    });
  };

  useEffect(() => {
    if (activeFilters == null) {
      return;
    }

    onFiltersChange(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    onWithLiquidityOnlyChange(withLiquidityOnly ?? true);
  }, [withLiquidityOnly]);

  useEffect(() => {
    if (activeOrdering == null) {
      return;
    }
    onOrderingChange(activeOrdering);
  }, [activeOrdering]);

  useEffect(() => {
    if (marketType == null) {
      return;
    }
    onMarketTypeChange(marketType);
  }, [marketType]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (queryState && !initialized) {
      const filters = getFiltersFromQueryState(queryState);
      const ordering = queryState.ordering;
      const liqudityOnly = queryState.liquidityOnly;
      const marketTypeValue = queryState.marketType;
      setActiveFilters(filters);
      setActiveOrdering(ordering);
      setWithLiquidityOnly(liqudityOnly);
      setMarketType(marketTypeValue);
      setInitialized(true);
    }
  }, [queryState]);

  return (
    <MarketFiltersContainer
      activeFilters={getFiltersFromQueryState(queryState)}
      portal={portalRef.current!}
      addActiveFilter={add}
      removeActiveFilter={remove}
      withLiquidityOnly={queryState.liquidityOnly}
      setWithLiquidityOnly={updateLiquidityOnly}
      ordering={queryState.ordering}
      setOrdering={updateOrdering}
      clearActiveFilters={clear}
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
    >
      <MobileDialog
        open={mobileDialogOpen}
        setOpen={setMobileDialogOpen}
        marketType={queryState?.marketType}
        onMarketTypeChange={updateMarketType}
      ></MobileDialog>
      <div className="relative z-30 w-full border-b-1 border-sky-200/30 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="container-fluid w-full">
          {portalRef.current ? (
            <>
              <div className="relative hidden items-center gap-1 py-1 sm:py-2 md:flex">
                <MarketTypeToggle
                  value={queryState.marketType}
                  onChange={updateMarketType}
                />
                <div className="h-5 w-px shrink-0 bg-gray-200"></div>
                <MarketFiltersSort className="shrink-0"></MarketFiltersSort>
                <div className="h-5 w-px shrink-0 bg-gray-200"></div>
                <MarketFiltersDropdowns className="flex shrink-0 items-center gap-1 lg:gap-2"></MarketFiltersDropdowns>
                <div className="h-5 w-px shrink-0 bg-gray-200"></div>
                <MarketFiltersCheckboxes className="shrink-0"></MarketFiltersCheckboxes>
                <MarketActiveFilters className="ml-auto shrink-0" />
              </div>
            </>
          ) : (
            <Skeleton width="80%" height="38px" className="py-2"></Skeleton>
          )}
          <button
            className="block w-full bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3 text-sm font-semibold text-sky-800 transition-all hover:bg-sky-100 md:hidden"
            onClick={() => setMobileDialogOpen(true)}
          >
            <span className="flex items-center justify-center gap-2">
              Filter & Sort Markets <ChevronDown size={16} />
            </span>
          </button>
          <div
            className="hidden md:block"
            id="marketsFiltersMenuPortal"
            ref={portalRef}
          ></div>
        </div>
      </div>
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
