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
import { isCampaignAsset } from "lib/constants";

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
}: {
  onFiltersChange: (filters: MarketFilter[]) => void;
  onOrderingChange: (ordering: MarketsOrderBy) => void;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
}) => {
  const [activeFilters, setActiveFilters] = useState<MarketFilter[]>();
  const [activeOrdering, setActiveOrdering] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();
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
      ></MobileDialog>
      <div className="sticky top-topbar-height z-20 mb-4 flex w-full flex-col justify-center bg-light-gray py-2 [&>*:not(:last-child)]:mb-3">
        {portalRef.current ? (
          <div className="hidden md:flex md:items-center md:gap-2">
            <MarketFiltersDropdowns className="flex items-center gap-2"></MarketFiltersDropdowns>
            <MarketFiltersCheckboxes className="ml-[20px] mr-[20px] hidden lg:block"></MarketFiltersCheckboxes>
            <MarketFiltersSort className="hidden lg:block"></MarketFiltersSort>
          </div>
        ) : (
          <Skeleton width="80%" height="44px" className="mb-[25px]"></Skeleton>
        )}
        <p
          className="block cursor-pointer text-ztg-blue md:hidden"
          onClick={() => setMobileDialogOpen(true)}
        >
          Find Your Market <ChevronDown className="mb-1 inline" size={20} />
        </p>
        <div
          className="!mb-0 hidden md:block"
          id="marketsFiltersMenuPortal"
          ref={portalRef}
        ></div>
        {portalRef.current ? (
          <div className="hidden items-center gap-6 md:flex lg:hidden">
            <MarketFiltersCheckboxes />
            <MarketFiltersSort />
          </div>
        ) : (
          <Skeleton width="40%" height="32px" className="mb-[25px]"></Skeleton>
        )}
        <MarketActiveFilters className="hidden gap-2 md:flex" />
      </div>
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
