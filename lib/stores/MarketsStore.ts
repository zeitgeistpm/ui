import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  Subscription,
} from "rxjs";
import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { makeAutoObservable, runInAction, when } from "mobx";
import MarketStore from "./MarketStore";
import Store, { useStore } from "./Store";

class MarketsStore {
  markets: Partial<Record<number, MarketStore>> = {};
  order: number[] = [];
  count: number = 0;
  pools: Swap[] = [];

  initialPageLoaded = false;

  setInitialPageLoaded() {
    this.initialPageLoaded = true;
  }

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
    await when(() => this.store.initialized === true);

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
