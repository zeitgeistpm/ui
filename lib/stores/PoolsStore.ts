import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { AssetId, FilteredPoolsListItem } from "@zeitgeistpm/sdk/dist/types";
import { ZTG_BLUE_COLOR } from "lib/constants";
import { calcSpotPrice } from "lib/math";
import { isAssetZTG, PoolsListQuery } from "lib/types";
import { getAssetIds } from "lib/util/market";
import * as N from "lib/util/normalize";
import { makeAutoObservable, runInAction } from "mobx";
import MarketStore from "./MarketStore";
import Store, { useStore } from "./Store";

export interface CPool {
  pool: Swap;
  market: MarketStore;
  assets: CAsset[];
  liquidity: number;
}

interface CAsset {
  id: number;
  color: string;
  ticker: string;
  percentage: number;
  price: number;
  amount: number;
}

export default class PoolsStore {
  chainPools: CPool[];
  chainPoolIndex: { id: number; marketId: number }[] = [];

  filteredPoolsList = N.empty<FilteredPoolsListItem, "poolId">();
  filteredPoolsListFullyLoaded = false;

  constructor(public store: Store) {
    makeAutoObservable(this, {}, { deep: false, autoBind: true });
  }

  async init() {
    const res: { id: number; marketId: number }[] = (
      await this.store.sdk.api.query.marketCommons.marketPool.entries()
    ).map(([storage, data]) => {
      const marketId = +storage.toHuman()[0];
      const id = data.toJSON();
      return { id, marketId };
    }) as any;
    runInAction(() => {
      this.chainPoolIndex = res.sort((a, b) => a.id - b.id);
    });
  }

  get filteredPoolsInOrder() {
    return N.toArray(this.filteredPoolsList);
  }

  async loadFilteredPools(query: PoolsListQuery) {
    const pools = await this.store.sdk.models.filterPools({
      offset: (query.pagination.page - 1) * query.pagination.pageSize,
      limit: query.pagination.pageSize,
    });
    if (!pools.length) {
      this.filteredPoolsListFullyLoaded = true;
    } else {
      this.filteredPoolsList = N.mergeR(
        this.filteredPoolsList,
        N.fromArray(pools, "poolId")
      );
    }
  }

  get chainPoolscount(): number {
    return this.chainPools?.length ?? 0;
  }

  get allPoolsShown(): boolean {
    return this.chainPools?.length === this.chainPoolIndex.length;
  }

  async loadPoolsFromChain(count: number) {
    let lastAddedPoolId =
      this.chainPoolscount > 0
        ? +this.chainPools[this.chainPoolscount - 1].pool.poolId
        : -1;
    const nextPoolId = (
      await this.store.sdk.api.query.swaps.nextPoolId()
    ).toJSON();

    let c = count;
    let poolId = lastAddedPoolId + 1;
    let morePools: CPool[] = [];

    while (c > 0 && poolId < nextPoolId) {
      const p = await this.loadPoolFromChain(poolId);
      poolId++;
      if (p == null) {
        continue;
      }
      morePools.push(p);
      c--;
    }
    runInAction(() => {
      if (this.chainPools == null) {
        this.chainPools = [...morePools];
      } else {
        this.chainPools = [...this.chainPools, ...morePools];
      }
    });
  }

  updateExistingChainPoolIndex(marketStore: MarketStore) {
    if (
      this.chainPoolIndex.findIndex(
        (item) => item.marketId === marketStore.id
      ) !== -1
    ) {
      return;
    }
    this.chainPoolIndex = [
      ...this.chainPoolIndex,
      { id: Number(marketStore.pool.poolId), marketId: marketStore.id },
    ].sort((a, b) => a.id - b.id);
  }

  async getPoolFromChain(poolId: number, bustCache = false) {
    const pool = bustCache
      ? null
      : this.chainPools?.find((pool) => pool.pool.poolId === poolId);
    if (pool) {
      return pool;
    } else {
      return await this.loadPoolFromChain(poolId);
    }
  }

  private async loadPoolFromChain(poolId: number): Promise<CPool | null> {
    const marketPoolPair = this.chainPoolIndex.find(
      (data) => data.id === poolId
    );
    if (marketPoolPair == null) {
      return null;
    }

    const pool = await this.store.sdk.models.fetchPoolData(poolId);

    const marketStore = await this.store.markets.getMarket(
      marketPoolPair.marketId
    );

    if (marketStore == null) {
      return null;
    }

    const assets = await this.getAssetsFromChain(marketStore);

    const liquidity = assets.reduce(
      (total, asset) => total + asset.amount * asset.price,
      0
    );

    return {
      pool,
      market: marketStore,
      assets: assets,
      liquidity: liquidity,
    };
  }

  private async getAssetsFromChain(
    marketStore: MarketStore
  ): Promise<CAsset[]> {
    const { pool } = marketStore;
    const assets: CAsset[] = [];
    const assetWeight = 10 / (pool.assets.length - 1);
    const ztgBalance = await this.store.getPoolBalance(pool, { ztg: null });

    for (const [token, weight] of pool.weights.unwrap().entries()) {
      // convert token to JSON / AssetId
      const assetId = token.toJSON() as AssetId;
      // check if token is ZTG
      const isZTG = isAssetZTG(assetId);

      const ids = getAssetIds(token);
      const id = ids?.assetId;

      const amount =
        ids != null
          ? (await this.store.getPoolBalance(pool, assetId)).toNumber()
          : ztgBalance.toNumber();

      const price = isZTG
        ? 1
        : calcSpotPrice(ztgBalance, 10, amount, assetWeight, 0).toNumber();

      const percentage = Math.round((weight / Number(pool.totalWeight)) * 100);
      const marketOutcome = marketStore.getMarketOutcome(assetId);

      if (marketOutcome) {
        const ticker = isZTG
          ? this.store.config.tokenSymbol
          : marketOutcome.metadata["ticker"];
        const color = isZTG ? ZTG_BLUE_COLOR : marketOutcome.metadata["color"];

        assets.push({
          id,
          percentage,
          ticker,
          color,
          price,
          amount,
        });
      }
    }
    return assets;
  }
}

export const usePoolsStore = () => {
  const store = useStore();
  return store.pools;
};
