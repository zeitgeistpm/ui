import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  Subscription,
} from "rxjs";
import { Market, Swap } from "@zeitgeistpm/sdk/dist/models";
import { makeAutoObservable, runInAction } from "mobx";
import MarketStore from "./MarketStore";
import Store, { useStore } from "./Store";
import { MarketsOrderBy, MarketsOrdering } from "@zeitgeistpm/sdk/dist/types";
import { MarketListQuery } from "lib/types";
import { activeStatusesFromFilters } from "lib/util/market";

class MarketsStore {
  markets: Partial<Record<number, MarketStore>> = {};
  order: number[] = [];
  count: number = 0;
  pools: Swap[] = [];

  constructor(public store: Store) {
    makeAutoObservable(this, {}, { deep: false });
  }

  private clearMarkets() {
    runInAction(() => {
      this.markets = {};
    });
  }

  private subscriptions: { [K in number]: Subscription[] } = {};

  unsubscribeAll() {
    for (const n in this.subscriptions) {
      const subs = this.subscriptions[n];
      subs.forEach((s) => s.unsubscribe());
    }
    if (this.markets) {
      for (const market of Object.values(this.markets)) {
        market.unsubscribe();
      }
    }
    this.clearMarkets();
  }

  private marketChanges$$ = new BehaviorSubject<number>(0);
  marketChanges$: Observable<number> = this.marketChanges$$.asObservable();

  private subscribeToMarketChanges(market: MarketStore) {
    const sub1 = market.poolChange$.subscribe((pool) => {
      if (pool == null) {
        return;
      }
      this.store.pools.updateExistingChainPoolIndex(market);
    });
    this.subscriptions[market.id] = [
      sub1,
      market.marketChange$.subscribe(() => {
        this.marketChanges$$.next(this.marketChanges$$.value + 1);
      }),
    ];
  }

  async getMarket(marketId: number): Promise<MarketStore | undefined> {
    let market = Object.values(this.markets).find((m) => m.id === marketId);

    if (market == null) {
      const marketStore = new MarketStore(this.store, marketId);
      this.updateMarkets(marketStore);
      const marketData = await this.store.sdk.models.fetchMarketData(marketId);
      if (!marketData) {
        return;
      }

      await marketStore.initializeMarketData(marketData);
      await marketStore.getAuthorityProxies();
      marketStore.startPolling();
      marketStore.subscribeToChainData();
      this.subscribeToMarketChanges(marketStore);
      return marketStore;
    } else {
      const marketLoaded = market.loaded;
      if (!marketLoaded) {
        await firstValueFrom(market.loaded$);
      }
      return market;
    }
  }

  private updateMarkets(market: MarketStore) {
    runInAction(() => {
      if (!this.markets) {
        this.markets = {};
      }
      this.markets = { ...this.markets, [market.id]: market };
    });
  }

  async fetchMarkets(query: MarketListQuery) {
    const { activeAccount } = this.store.wallets;

    const { pagination, filter, sorting, myMarketsOnly, tag, searchText } =
      query;

    let orderBy: MarketsOrderBy;

    if (sorting.sortBy === "EndDate") {
      orderBy = "end";
    } else if (sorting.sortBy === "CreatedAt") {
      orderBy = "newest";
    } else {
      orderBy = "end";
    }

    let marketsData: Market[];
    let count: number;

    if (myMarketsOnly) {
      const filtersOff =
        filter.creator === false &&
        filter.oracle === false &&
        filter.hasAssets === false;

      const oracle =
        filtersOff || filter.oracle ? activeAccount?.address : undefined;
      const creator =
        filtersOff || filter.creator ? activeAccount?.address : undefined;
      const assetOwner =
        filtersOff || filter.hasAssets ? activeAccount?.address : undefined;

      const filterBy = {
        oracle,
        creator,
        assetOwner,
        liquidityOnly: false,
      };
      ({ result: marketsData, count } =
        await this.store.sdk.models.filterMarkets(filterBy, {
          pageSize: pagination.pageSize * pagination.page,
          pageNumber: 1,
          ordering: sorting.order as MarketsOrdering,
          orderBy,
        }));
    } else {
      const statuses = activeStatusesFromFilters(filter);
      ({ result: marketsData, count } =
        await this.store.sdk.models.filterMarkets(
          {
            statuses: statuses.length === 0 ? undefined : statuses,
            searchText,
            liquidityOnly: filter.HasLiquidityPool,
            tags: tag && [tag],
          },
          {
            pageSize: pagination.pageSize * pagination.page,
            pageNumber: 1,
            ordering: sorting.order as MarketsOrdering,
            orderBy,
          },
        ));
    }

    let markets: MarketStore[] = [];

    let order = [];
    for (const data of marketsData) {
      const id = data.marketId;
      markets = [...markets, await this.getMarket(id)];
      order = [...order, id];
    }

    this.setCount(count);
    this.setOrder(order);

    return { markets, count };
  }

  setCount(count: number) {
    this.count = count;
  }

  setOrder(order: number[]) {
    this.order = order;
  }
}

export default MarketsStore;

export const useMarketsStore = () => {
  const store = useStore();
  return store?.markets;
};
