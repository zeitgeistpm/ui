import {
  CategoricalAssetId,
  Context,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  IndexerContext,
  Market,
  Pool,
  SaturatedPoolEntryAsset,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { MAX_IN_OUT_RATIO, ZTG } from "lib/constants";
import { useAccountAssetBalance } from "lib/hooks/queries/useAccountAssetBalance";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { usePoolZtgBalance } from "lib/hooks/queries/usePoolZtgBalance";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { calcInGivenOut, calcOutGivenIn } from "lib/math";
import { useStore } from "lib/stores/Store";
import { isEqual } from "lodash";
import { useMemo } from "react";

/**
 * Hook and state related to the tradeslip.
 */

export type UseTradeslipState = {
  /**
   * The items added by the user using the `put` method.
   * Rendered in the right drawer.
   * @persistent - local
   */
  items: TradeSlipItem[];
  /**
   * Is the user currently transacting for the current items.
   */
  isTransacting: boolean;
  /**
   * The slippage percentage to use.
   * @persistent - local
   */
  slippage: number;
  /**
   * Remote data pr item; including pool, market, max amount, cost, swap fee, asset etc.
   */
  data: Map<string, TradeSlipItemData>;
  /**
   * Total cost / gain for the items.
   */
  total: Decimal;
  /**
   * Put(new or update) item to the items list.
   */
  put: (item: TradeSlipItem) => void;
  /**
   * Remove item from the items list.
   */
  removeAsset: (asset: TradeSlipItem["assetId"]) => void;
  /**
   * Check if the state has an item by its AssetId.
   */
  hasAsset: (asset: TradeSlipItem["assetId"]) => boolean;
  /**
   * Get an item by its AssetId.
   */
  getByAsset: (asset: TradeSlipItem["assetId"]) => TradeSlipItem;
  /**
   * Set the slippage percentage.
   */
  setSlippage: (update?: number) => void;
};

/**
 * An item in the tradeslip list.
 */
export type TradeSlipItem = {
  action: "buy" | "sell";
  assetId: CategoricalAssetId | ScalarAssetId;
  amount: number;
};

/**
 * Remote and calculated data pr tradeslip item.
 */
export type TradeSlipItemData = {
  /**
   * Market related to the item.
   */
  market: Market<Context>;
  /**
   * Pool related to the item.
   */
  pool: Pool<IndexerContext>;
  /**
   * Asset data related to the item.
   */
  asset: SaturatedPoolEntryAsset;
  /**
   * Max value for the item relative to which action the user is performing,
   * pool asset balances. and user balances.
   */
  max: Decimal;
  /**
   * Total cost/gain for the combined transaction.
   */
  cost: Decimal;
  /**
   * Swap fee for the item transaction.
   */
  swapFee: Decimal;
  /**
   * Free balance the trader has of the items asset.
   */
  traderAssetBalance: Decimal;
  /**
   * Free balance the pool has of the items asset.
   */
  poolAssetBalance: Decimal;
};

/**
 * Atom storage for tradeslip items.
 *
 * @persistent - local
 */
const tradeSlipItemsAtom = atomWithStorage<TradeSlipItem[]>(
  "trade-slip-items",
  [],
);

/**
 * Atom storage for the isTransacting state.
 */
const tradeSlipIsTransactingAtom = atom<boolean>(false);

/**
 * Atom storage for tradeslip slippage percentage.
 * @persistent - local
 */
const tradeSlipSlippagePercentage = atomWithStorage<number>(
  "trade-slip-slippage-percentage",
  1,
);

/**
 * Identify a TradeSlipItem by its action and asset id.
 *
 * @param item TradeSlipItem
 * @returns string
 */
export const itemKey = (item: TradeSlipItem): string =>
  `${item.action}|${JSON.stringify(item.assetId)}`;

/**
 * Hook to get the tradeslip state, calculated/remote data and interaction methods.
 *
 * @returns UseTradeslipState
 */
export const useTradeSlipState = (): UseTradeslipState => {
  const [slippage, setSlippage] = useAtom(tradeSlipSlippagePercentage);
  const [isTransacting, setIsTransacting] = useAtom(tradeSlipIsTransactingAtom);
  const [items, setItems] = useAtom(tradeSlipItemsAtom);

  const { wallets } = useStore();
  const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;

  const { data: traderZtgBalance } = useZtgBalance(signer);

  const { data: pools } = usePoolsByIds(
    items.map((item) => ({ marketId: getMarketIdOf(item.assetId) })),
  );

  const { data: saturatedIndex } = useSaturatedPoolsIndex(pools || []);

  const { data: poolZtgBalances } = usePoolZtgBalance(pools ?? []);

  const { data: traderAssets } = useAccountAssetBalance(
    items.map((item) => ({
      account: signer?.address,
      assetId: item.assetId,
    })),
  );

  const { data: poolAssetBalances } = useAccountAssetBalance(
    items.map((item) => ({
      account: pools?.find((p) => p.marketId === getMarketIdOf(item.assetId))
        ?.accountId,
      assetId: item.assetId,
    })),
  );

  const data: Map<string, TradeSlipItemData> = useMemo(() => {
    if (
      pools?.length &&
      saturatedIndex &&
      traderAssets?.length &&
      poolZtgBalances?.length &&
      poolAssetBalances?.length &&
      traderZtgBalance
    ) {
      return items.reduce((data, item, index) => {
        const amount = new Decimal(item.amount);

        const pool = pools.find(
          (p) => p.marketId === getMarketIdOf(item.assetId),
        );

        const assetIndex = getIndexOf(item.assetId);
        const saturatedData = saturatedIndex?.[pool?.poolId];
        const asset = saturatedData?.assets[assetIndex];
        const market = saturatedData?.market;

        const traderAssetBalance = traderAssets[index];
        const poolAssetBalance = poolAssetBalances[index];
        const poolZtgBalance = poolZtgBalances.find(
          ({ pool }) => pool.marketId === getMarketIdOf(item.assetId),
        );

        const tradeablePoolBalance = new Decimal(
          poolAssetBalance?.free.toString() ?? 0,
        ).mul(MAX_IN_OUT_RATIO);

        const swapFee = new Decimal(pool?.swapFee || 0);

        const ztgWeight = pool
          ? getAssetWeight(pool, { Ztg: null }).unwrap()
          : undefined;

        const assetWeight = asset
          ? getAssetWeight(pool, asset?.assetId).unwrap()
          : undefined;

        const ztg = new Decimal(traderZtgBalance?.data.free.toString() ?? 0);
        const assets = new Decimal(traderAssetBalance?.free.toString() ?? 0);

        let max = new Decimal(0);

        if (item.action === "buy") {
          const maxTokens = ztg.div(asset?.price.div(ZTG) ?? 0);
          if (tradeablePoolBalance?.lte(maxTokens)) {
            max = tradeablePoolBalance;
          } else {
            max = maxTokens;
          }
        } else {
          if (tradeablePoolBalance?.lte(assets)) {
            max = tradeablePoolBalance;
          }
          max = assets;
        }

        let cost = new Decimal(0);

        if (item.action === "buy") {
          cost = calcInGivenOut(
            poolZtgBalance?.balance.data.free.toString(),
            ztgWeight,
            poolAssetBalance?.free.toString(),
            assetWeight,
            amount.mul(ZTG),
            swapFee.div(ZTG),
          );
        } else {
          cost = calcOutGivenIn(
            poolAssetBalance?.free.toString(),
            assetWeight,
            poolZtgBalance?.balance.data.free.toString(),
            ztgWeight,
            amount.mul(ZTG),
            swapFee.div(ZTG),
          );
        }

        return new Map(data).set(itemKey(item), {
          market,
          pool,
          max,
          cost,
          swapFee,
          asset,
          traderAssetBalance: new Decimal(traderAssetBalance?.free.toString()),
          poolAssetBalance: new Decimal(poolAssetBalance?.free.toString()),
        });
      }, new Map<string, TradeSlipItemData>());
    }

    return new Map<string, TradeSlipItemData>();
  }, [
    items,
    pools,
    saturatedIndex,
    traderAssets,
    poolZtgBalances,
    poolAssetBalances,
    traderZtgBalance,
  ]);

  const total = useMemo(() => {
    if (data) {
      return items.reduce((acc, item) => {
        const dataForItem = data.get(itemKey(item));
        return item.action === "buy"
          ? acc.minus(dataForItem?.cost ?? 0)
          : acc.plus(dataForItem?.cost ?? 0);
      }, new Decimal(0));
    }
    return new Decimal(0);
  }, [data]);

  const put = (item: TradeSlipItem) => {
    const existing = items.find(({ assetId: asset }) =>
      isEqual(asset, item.assetId),
    );
    if (existing) {
      setItems(
        items.map((cand) =>
          isEqual(item.assetId, cand.assetId) ? item : cand,
        ),
      );
    } else {
      setItems([...items, item]);
    }
  };

  const removeAsset = (asset: TradeSlipItem["assetId"]) => {
    setItems(items.filter((cand) => !isEqual(asset, cand.assetId)));
  };

  const getByAsset = (asset: TradeSlipItem["assetId"]) =>
    items.find((cand) => isEqual(cand.assetId, asset));

  const hasAsset = (asset: TradeSlipItem["assetId"]) =>
    Boolean(getByAsset(asset));

  return {
    items,
    isTransacting,
    slippage,
    data,
    total,
    put,
    removeAsset,
    hasAsset,
    getByAsset,
    setSlippage,
  };
};
