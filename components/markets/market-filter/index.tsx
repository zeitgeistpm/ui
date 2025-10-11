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
    if (!activeFilters) return;

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
    if (!activeFilters) return;
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
      setWithLiquidityOnly={setWithLiquidityOnly}
      ordering={queryState.ordering}
      setOrdering={setActiveOrdering}
      clearActiveFilters={clear}
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
    >
      <MobileDialog
        open={mobileDialogOpen}
        setOpen={setMobileDialogOpen}
        marketType={queryState?.marketType}
        onMarketTypeChange={setMarketType}
      ></MobileDialog>
      <div className="sticky top-topbar-height z-20 mb-4 flex w-full flex-col justify-center bg-gradient-to-b from-white via-sky-50/20 to-transparent py-2 backdrop-blur-sm">
        {portalRef.current ? (
          <>
            <div className="hidden w-full md:flex md:flex-nowrap md:items-center md:gap-1 md:overflow-x-auto md:rounded-lg md:bg-white/60 md:px-2 md:py-2 md:shadow-md md:backdrop-blur-sm lg:gap-2 lg:px-3">
              <MarketTypeToggle
                value={queryState.marketType}
                onChange={setMarketType}
              />
              <div className="h-5 w-px shrink-0 bg-gray-200"></div>
              <MarketFiltersDropdowns className="flex shrink-0 items-center gap-1 lg:gap-2"></MarketFiltersDropdowns>
              <div className="h-5 w-px shrink-0 bg-gray-200"></div>
              <MarketFiltersCheckboxes className="shrink-0"></MarketFiltersCheckboxes>
              <div className="h-5 w-px shrink-0 bg-gray-200"></div>
              <MarketFiltersSort className="shrink-0"></MarketFiltersSort>
              <MarketActiveFilters className="ml-auto shrink-0" />
            </div>
          </>
        ) : (
          <Skeleton width="80%" height="38px" className="mb-4"></Skeleton>
        )}
        <button
          className="mt-2 block w-full rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3 text-sm font-semibold text-sky-800 shadow-md transition-all hover:shadow-lg md:hidden"
          onClick={() => setMobileDialogOpen(true)}
        >
          <span className="flex items-center justify-center gap-2">
            Filter & Sort Markets <ChevronDown size={16} />
          </span>
        </button>
        <div
          className="!mb-0 hidden md:block"
          id="marketsFiltersMenuPortal"
          ref={portalRef}
        ></div>
      </div>
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
