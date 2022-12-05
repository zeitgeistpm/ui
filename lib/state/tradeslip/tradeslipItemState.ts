import { useQuery } from "@tanstack/react-query";
import {
  Context,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  IndexerContext,
  isNA,
  Market,
  NA,
  Pool,
  SaturatedPoolEntryAsset,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useAtom } from "jotai";
import { MAX_IN_OUT_RATIO, ZTG } from "lib/constants";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { usePoolZtgBalance } from "lib/hooks/queries/usePoolZtgBalance";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { calcInGivenOut, calcOutGivenIn } from "lib/math";
import { useStore } from "lib/stores/Store";
import { useEffect } from "react";
import { TradeSlipItem } from "./items";
import { slippagePercentageAtom } from "./slippage";

/**
 * Composite id/key for a certain item by its assetid and action.
 */
export type TradeSlipItemDataKey = string & { readonly _tag: unique symbol };

/**
 * Identify a TradeSlipItem by its action and asset id.
 *
 * @param item TradeSlipItem
 * @returns string
 */
export const itemKey = (item: TradeSlipItem): TradeSlipItemDataKey =>
  `${item.action}|${JSON.stringify(item.assetId)}` as TradeSlipItemDataKey;

export const rootKey = "trade-slip-item-state";

/**
 * Hook and state related to a tradeslip item.
 */

export type UseTradeslipItemState = {
  /**
   * Pool related to the item.
   */
  pool: Pool<IndexerContext>;
  /**
   * Asset data related to the item.
   */
  asset: SaturatedPoolEntryAsset;
  /**
   * Market related to the item.
   */
  market: Market<Context>;
  /**
   * Weight setting of the ztg in the pool.
   */
  ztgWeight: Decimal;
  /**
   * Weight setting of the items asset in the pool.
   */
  assetWeight: Decimal;
  /**
   * Swap fee for the items pool.
   */
  swapFee: Decimal;
  /**
   * Ztg balance of the trader.
   */
  traderZtgBalance: Decimal | NA;
  /**
   * Free ztg balance in the assets pool.
   */
  poolZtgBalance: Decimal | NA;
  /**
   * Free balance the trader has of the items asset.
   */
  traderAssetBalance: Decimal;
  /**
   * Free balance the pool has of the items asset.
   */
  poolAssetBalance: Decimal;
  /**
   * Amount of tradable assets in the pool.
   */
  tradeablePoolBalance: Decimal;

  sum: Decimal;

  max: Decimal;
};

export const useTradeslipItemState = (item: TradeSlipItem) => {
  const [, id] = useSdkv2();
  const { wallets } = useStore();
  const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;

  const [slippage] = useAtom(slippagePercentageAtom);

  const { data: traderZtgBalance } = useZtgBalance(signer);

  const { data: pools } = usePoolsByIds([
    { marketId: getMarketIdOf(item.assetId) },
  ]);

  const { data: saturatedIndex } = useSaturatedPoolsIndex(pools || []);

  const poolZtgBalances = usePoolZtgBalance(pools ?? []);

  const traderAssets = useAccountAssetBalances([
    {
      account: signer?.address,
      assetId: item.assetId,
    },
  ]);

  const pool = pools?.[0];

  const poolAssetBalances = useAccountAssetBalances([
    {
      account: pool?.accountId,
      assetId: item.assetId,
    },
  ]);

  const assetIndex = getIndexOf(item.assetId);
  const saturatedData = saturatedIndex?.[pool?.poolId];
  const asset = saturatedData?.assets[assetIndex];
  const market = saturatedData?.market;

  const ztgWeight = pool ? getAssetWeight(pool, { Ztg: null }).unwrap() : null;

  const assetWeight = asset
    ? getAssetWeight(pool, asset?.assetId).unwrap()
    : null;

  const swapFee = pool?.swapFee ? new Decimal(pool.swapFee) : null;

  const poolZtgBalance =
    !poolZtgBalances[0] || isNA(poolZtgBalances[0])
      ? null
      : new Decimal(poolZtgBalances[0].balance.data.free.toString());

  const traderAssetBalance =
    !traderAssets[0] || isNA(traderAssets[0])
      ? null
      : new Decimal(traderAssets[0].free.toString());

  const poolAssetBalance =
    !poolAssetBalances[0] || isNA(poolAssetBalances[0])
      ? null
      : new Decimal(poolAssetBalances[0]?.free.toString());

  const tradeablePoolBalance =
    !poolAssetBalance || isNA(poolAssetBalance)
      ? null
      : new Decimal(poolAssetBalance).mul(MAX_IN_OUT_RATIO);

  const enabled = Boolean(
    item &&
      pool &&
      asset &&
      market &&
      ztgWeight &&
      assetWeight &&
      swapFee &&
      poolZtgBalance &&
      traderAssetBalance &&
      poolAssetBalance &&
      tradeablePoolBalance,
  );

  const query = useQuery<UseTradeslipItemState>(
    [id, rootKey, itemKey(item)],
    async () => {
      if (enabled) {
        const max = (() => {
          if (isNA(traderZtgBalance)) {
            return new Decimal(0);
          }
          if (item.action === "buy") {
            const maxTokens = isNA(traderZtgBalance)
              ? new Decimal(Infinity)
              : traderZtgBalance.div(asset?.price.div(ZTG) ?? 0);
            if (tradeablePoolBalance?.lte(maxTokens)) {
              return tradeablePoolBalance;
            } else {
              return maxTokens;
            }
          } else {
            if (tradeablePoolBalance?.lte(traderAssetBalance)) {
              return tradeablePoolBalance;
            } else {
              return traderAssetBalance;
            }
          }
        })();

        const sum =
          item.action === "buy"
            ? calcInGivenOut(
                poolZtgBalance,
                ztgWeight,
                poolAssetBalance,
                assetWeight,
                new Decimal(item.amount).mul(ZTG),
                swapFee.div(ZTG),
              )
            : calcOutGivenIn(
                poolAssetBalance,
                assetWeight,
                poolZtgBalance,
                ztgWeight,
                new Decimal(item.amount).mul(ZTG),
                swapFee.div(ZTG),
              );

        return {
          pool,
          asset,
          market,
          ztgWeight,
          assetWeight,
          swapFee,
          traderZtgBalance,
          poolZtgBalance,
          traderAssetBalance,
          poolAssetBalance,
          tradeablePoolBalance,
          sum,
          max,
        };
      }

      return null;
    },
    {
      enabled,
    },
  );

  useEffect(() => {
    query.refetch();
  }, [itemKey(item), slippage, item?.amount]);

  return query;
};
