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

export type UseTradeslipState = {
  items: TradeSlipItem[];
  isTransacting: boolean;
  slippage: number;
  data: Map<string, TradeSlipItemData>;
  total: Decimal;
  put: (item: TradeSlipItem) => void;
  removeAsset: (asset: TradeSlipItem["assetId"]) => void;
  hasAsset: (asset: TradeSlipItem["assetId"]) => boolean;
  getByAsset: (asset: TradeSlipItem["assetId"]) => TradeSlipItem;
  setSlippage: (update?: number) => void;
};

export type TradeSlipItem = {
  action: "buy" | "sell";
  assetId: CategoricalAssetId | ScalarAssetId;
  amount: number;
};

export type TradeSlipItemData = {
  market: Market<Context>;
  pool: Pool<IndexerContext>;
  max: Decimal;
  cost: Decimal;
  swapFee: Decimal;
  asset: SaturatedPoolEntryAsset;
  traderAssetBalance: Decimal;
  poolAssetBalance: Decimal;
};

const tradeSlipIsTransactingAtom = atom<boolean>(false);

const tradeSlipItemsAtom = atomWithStorage<TradeSlipItem[]>(
  "trade-slip-items",
  [],
);

const tradeSlipSlippagePercentage = atomWithStorage<number>(
  "trade-slip-slippage-percentage",
  1,
);

export const itemKey = (item: TradeSlipItem): string =>
  `${item.action}|${JSON.stringify(item.assetId)}`;

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
