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
import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDown } from "react-feather";
import MarketActiveFilters from "./MarketActiveFilters";
import MarketFiltersCheckboxes from "./MarketFiltersCheckboxes";
import MarketFiltersContainer, { SelectedMenu } from "./MarketFiltersContainer";
import MarketFiltersDropdowns from "./MarketFiltersDropdowns";
import MarketFiltersSort from "./MarketFiltersSort";
import MobileDialog from "./mobile-dialog";
import MarketTypeToggle from "./MarketTypeToggle";
import { Menu, Transition } from "@headlessui/react";
import { FiPlusSquare } from "react-icons/fi";
import { MdShowChart, MdStackedLineChart } from "react-icons/md";
import Link from "next/link";

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
        ordering={queryState?.ordering}
        onOrderingChange={updateOrdering}
      ></MobileDialog>
      <div
        className="relative -z-10 w-full border-b-2 border-white/10 bg-ztg-primary-500 shadow-md backdrop-blur-md"
        id="market-filters-container"
      >
        <div className="container-fluid w-full">
          {portalRef.current ? (
            <>
              <div className="relative hidden flex-wrap items-center gap-1.5 py-1 sm:gap-2 sm:py-2 md:flex md:gap-3">
                <MarketTypeToggle
                  value={queryState.marketType}
                  onChange={updateMarketType}
                />
                <div className="h-5 w-px shrink-0 bg-ztg-green-500/40"></div>
                <MarketFiltersSort className="shrink-0"></MarketFiltersSort>
                <div className="h-5 w-px shrink-0 bg-ztg-green-500/40"></div>
                <MarketFiltersDropdowns className="flex shrink-0 items-center gap-1.5 sm:gap-2"></MarketFiltersDropdowns>
                <div className="h-5 w-px shrink-0 bg-ztg-green-500/40"></div>
                <MarketFiltersCheckboxes className="shrink-0"></MarketFiltersCheckboxes>
                {/* Spacer that grows to push action items right, but doesn't affect wrapped rows */}
                <div className="min-w-0 shrink-0 flex-grow basis-0"></div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
                  <MarketActiveFilters className="shrink-0" />
                  <Menu as="div" className="relative shrink-0">
                    {({ open }) => (
                      <>
                        <Menu.Button
                          className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 ${
                            open
                              ? "bg-white/15 text-white"
                              : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          <FiPlusSquare
                            size={14}
                            className="hidden text-ztg-green-400 sm:inline sm:h-4 sm:w-4"
                          />
                          <span>Create Market</span>
                          <ChevronDown
                            size={14}
                            className={`ml-0.5 transition-transform sm:h-4 sm:w-4 ${open ? "rotate-180" : ""}`}
                          />
                        </Menu.Button>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-ztg-primary-500/90 shadow-md backdrop-blur-md border-2 border-white/10">
                            <div className="p-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <Link href="/create">
                                    <button
                                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                                        active ? "bg-white/20" : ""
                                      }`}
                                    >
                                      <MdShowChart
                                        size={18}
                                        className="text-ztg-green-400"
                                      />
                                      <div className="flex flex-col items-start">
                                        <span className="font-semibold text-white/90">
                                          Single Market
                                        </span>
                                      </div>
                                    </button>
                                  </Link>
                                )}
                              </Menu.Item>

                              <Menu.Item>
                                {({ active }) => (
                                  <Link href="/create-combo">
                                    <button
                                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                                        active ? "bg-white/20" : ""
                                      }`}
                                    >
                                      <MdStackedLineChart
                                        size={18}
                                        className="text-ztg-green-400"
                                      />
                                      <div className="flex flex-col items-start">
                                        <span className="font-semibold text-white/90">
                                          Combinatorial Market
                                        </span>
                                        <span className="text-xs text-white/70">
                                          Multi-market combinations
                                        </span>
                                      </div>
                                    </button>
                                  </Link>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            </>
          ) : (
            <Skeleton width="80%" height="38px" className="py-2"></Skeleton>
          )}
          <div
            className="w-content max-w-7xl hidden md:block absolute top-14 left-15 bg-ztg-primary-500/80 shadow-md backdrop-blur-md"
            id="marketsFiltersMenuPortal"
            ref={portalRef}
          ></div>
        </div>
        <button
          className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-3 border-t-2 border-white/10 bg-white/15 px-4 py-3 text-base font-semibold text-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 md:hidden"
          onClick={() => setMobileDialogOpen(true)}
        >
          <span className="whitespace-nowrap">Filter & Sort Markets</span>
          <ChevronDown
            size={20}
            className="shrink-0 text-white/70 transition-transform"
          />
        </button>
      </div>
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
