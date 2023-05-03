import { useState, useRef, useEffect } from "react";
import {
  MarketFilter,
  MarketsListQuery,
  MarketsOrderBy,
} from "lib/types/market-filter";
import { findFilterIndex } from "lib/util/market-filter";
import { filterTypes } from "lib/constants/market-filter";
import Skeleton from "components/ui/Skeleton";
import useMarketsUrlQuery from "lib/hooks/useMarketsUrlQuery";
import MarketActiveFilters from "./MarketActiveFilters";
import MarketFiltersContainer, { SelectedMenu } from "./MarketFiltersContainer";
import MobileDialog from "./MobileDialog";
import MarketFiltersDropdowns from "./MarketFiltersDropdowns";
import MarketFiltersCheckboxes from "./MarketFiltersCheckboxes";
import MarketFiltersSort from "./MarketFiltersSort";
import { ChevronDown } from "react-feather";

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
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  const [selectedMenu, setSelectedMenu] = useState<SelectedMenu>("None");

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
      addActiveFilter={add}
      removeActiveFilter={remove}
      withLiquidityOnly={withLiquidityOnly}
      setWithLiquidityOnly={setWithLiquidityOnly}
      ordering={activeOrdering}
      setOrdering={setActiveOrdering}
      clearActiveFilters={clear}
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
    >
      <MobileDialog
        open={mobileDialogOpen}
        setOpen={setMobileDialogOpen}
      ></MobileDialog>
      <div className="w-full flex flex-col items-center justify-center mb-[30px]">
        {portalRef.current ? (
          <div className="hidden md:flex md:items-center md:gap-2 md:mb-6">
            <MarketFiltersDropdowns className="flex items-center gap-2"></MarketFiltersDropdowns>
            <MarketFiltersCheckboxes className="hidden lg:block mr-[20px] ml-[20px]"></MarketFiltersCheckboxes>
            <MarketFiltersSort className="hidden lg:block"></MarketFiltersSort>
          </div>
        ) : (
          <Skeleton width="80%" height="44px" className="mb-[25px]"></Skeleton>
        )}
        <p
          className="block md:hidden text-ztg-blue cursor-pointer mb-6"
          onClick={() => setMobileDialogOpen(true)}
        >
          Find Your Market <ChevronDown className="inline mb-1" size={20} />
        </p>
        <div
          className="hidden md:block"
          id="marketsFiltersMenuPortal"
          ref={portalRef}
        ></div>
        {portalRef.current ? (
          <div className="hidden md:flex items-center gap-6 mb-6 lg:hidden">
            <MarketFiltersCheckboxes></MarketFiltersCheckboxes>
            <MarketFiltersSort></MarketFiltersSort>
          </div>
        ) : (
          <Skeleton width="40%" height="32px" className="mb-[25px]"></Skeleton>
        )}
        <MarketActiveFilters className="hidden md:flex gap-2" />
      </div>
    </MarketFiltersContainer>
  );
};

export default MarketFilterSelection;
