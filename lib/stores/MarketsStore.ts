import SDK from "@zeitgeistpm/sdk";
import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  Subscription,
} from "rxjs";
import { Market, Swap } from "@zeitgeistpm/sdk/dist/models";
import { makeAutoObservable, runInAction, when } from "mobx";
import MarketStore from "./MarketStore";
import Store, { useStore } from "./Store";
import { MarketsOrderBy, MarketsOrdering } from "@zeitgeistpm/sdk/dist/types";
import { MarketListQuery } from "lib/types";
import { activeStatusesFromFilters } from "lib/util/market";

class MarketsStore {
  marketIds: number[];
  markets: Partial<Record<number, MarketStore>> = {};
  order: number[] = [];
  count: number = 0;
  pools: Swap[] = [];

  async updateMarketIds(): Promise<number[]> {
    runInAction(() => {
      this.marketIds = undefined;
    });
    const ids = await this.sdk.models.getAllMarketIds();
    runInAction(() => {
      this.marketIds = ids;
    });
    return ids;
  }

  get loaded() {
    return this.marketIds != null;
  }

  private sdk: SDK;

  constructor(public store: Store) {
    this.sdk = this.store.sdk;
    makeAutoObservable(this, {}, { deep: false });
  }

  private clearMarkets() {
    runInAction(() => {
      this.marketIds = undefined;
      this.markets = [];
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
    await when(() => this.marketIds != null);
    if (!this.marketIds.includes(marketId)) {
      return;
    }
    let market = Object.values(this.markets).find((m) => m.id === marketId);

    if (market == null) {
      const marketStore = new MarketStore(this.store, marketId);
      this.updateMarkets(marketStore);
      const marketData = await this.store.sdk.models.fetchMarketData(marketId);
      if (!marketData) {
        return;
      }

      await marketStore.initializeMarketData(marketData);
      marketStore.startPolling();
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

  private unsubscribeMarket(marketId: number) {
    if (!this.subscriptions.hasOwnProperty(marketId)) {
      return;
    }
    const subs = this.subscriptions[marketId];
    subs.forEach((s) => s.unsubscribe());
    this.subscriptions[marketId] = undefined;
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
      const filterBy = {
        oracle: filter.oracle ? activeAccount.address : "",
        creator: filter.creator ? activeAccount.address : "",
        liquidityOnly: false,
        assetOwner: filter.hasAssets ? activeAccount.address : undefined,
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

    const markets: MarketStore[] = [];

    for (const data of marketsData) {
      const marketStore = new MarketStore(this.store, data.marketId);
      marketStore.initializeMarketData(data);
      markets.push(marketStore);
    }

    runInAction(() => {
      this.markets = markets.reduce((markets, market) => {
        return {
          ...markets,
          [market.id]: market,
        };
      }, {});

      this.order = markets.map((market) => market.id);

      this.count = count;
    });

    return { markets, count };
  }
}

export default MarketsStore;

export const useMarketsStore = () => {
  const store = useStore();
  return store.markets;
};
