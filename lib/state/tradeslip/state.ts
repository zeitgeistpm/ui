import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { RuntimeDispatchInfo } from "@polkadot/types/interfaces";
import { useQuery } from "@tanstack/react-query";
import {
  Context,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  IndexerContext,
  isRpcSdk,
  Market,
  Pool,
  SaturatedPoolEntryAsset,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { atom, useAtom } from "jotai";
import { MAX_IN_OUT_RATIO, ZTG } from "lib/constants";
import { useAccountAssetBalance } from "lib/hooks/queries/useAccountAssetBalance";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { usePoolZtgBalance } from "lib/hooks/queries/usePoolZtgBalance";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { calcInGivenOut, calcOutGivenIn } from "lib/math";
import { useStore } from "lib/stores/Store";
import { useMemo } from "react";
import { TradeSlipItem, useTradeslipItems } from "./items";
import { slippagePercentageAtom } from "./slippage";

/**
 * Hook and state related to the tradeslip state.
 */

export type UseTradeslipState = {
  /**
   * Total cost / gain for the items.
   */
  total: Decimal;
  /**
   * Get remote and calculated data for a tradeslip item; including pool, market, max amount, cost, swap fee, asset etc.
   */
  get: (key: TradeSlipItemDataKey) => TradeSlipItemData;
  /**
   * The batched transaction for the current tradeslip.
   */
  transaction?: SubmittableExtrinsic<"promise", ISubmittableResult> | null;
  /**
   * The transaction fees for the current tradeslip.
   */
  transactionFees: Decimal;
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
  sum: Decimal;
  /**
   * Swap fee for the item transaction.
   */
  swapFee: Decimal;
  /**
   * Free ztg balance in the assets pool.
   */
  poolZtgBalance: Decimal;
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

/**
 * Atom storage for the isTransacting state.
 */
const tradeSlipIsTransactingAtom = atom<boolean>(false);

/**
 * Hook to get the tradeslip state, calculated/remote data and interaction methods.
 *
 * @container
 *
 * @note container hooks should only be called in one component to prevent uneccesarry data fetching/computing;
 *  and pass the date down to the components that need it.
 *
 * @returns UseTradeslipState
 */
export const useTradeSlipState = (): UseTradeslipState => {
  const [sdk, id] = useSdkv2();
  const [slippage] = useAtom(slippagePercentageAtom);
  const [isTransacting, setIsTransacting] = useAtom(tradeSlipIsTransactingAtom);
  const { items } = useTradeslipItems();

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

  const data: Map<TradeSlipItemDataKey, TradeSlipItemData> = useMemo(() => {
    if (
      pools?.length &&
      saturatedIndex &&
      Object.keys(saturatedIndex).length &&
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

        const swapFee = new Decimal(pool?.swapFee || 0);

        const ztgWeight = pool
          ? getAssetWeight(pool, { Ztg: null }).unwrap()
          : undefined;

        const assetWeight = asset
          ? getAssetWeight(pool, asset?.assetId).unwrap()
          : undefined;

        const ztg = new Decimal(traderZtgBalance?.data.free.toString() ?? 0);
        const assets = new Decimal(traderAssetBalance?.free.toString() ?? 0);

        const tradeablePoolBalance = new Decimal(
          poolAssetBalance?.free.toString() ?? 0,
        ).mul(MAX_IN_OUT_RATIO);

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
          } else {
            max = assets;
          }
        }

        let sum = new Decimal(0);

        if (item.action === "buy") {
          sum = calcInGivenOut(
            poolZtgBalance?.balance.data.free.toString(),
            ztgWeight,
            poolAssetBalance?.free.toString(),
            assetWeight,
            amount.mul(ZTG),
            swapFee.div(ZTG),
          );
        } else {
          sum = calcOutGivenIn(
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
          sum,
          swapFee,
          asset,
          poolZtgBalance: new Decimal(
            poolZtgBalance?.balance.data.free.toString(),
          ),
          traderAssetBalance: new Decimal(traderAssetBalance?.free.toString()),
          poolAssetBalance: new Decimal(poolAssetBalance?.free.toString()),
        });
      }, new Map<TradeSlipItemDataKey, TradeSlipItemData>());
    }

    return new Map<TradeSlipItemDataKey, TradeSlipItemData>();
  }, [
    items,
    pools,
    saturatedIndex,
    traderAssets,
    poolZtgBalances,
    poolAssetBalances,
    traderZtgBalance,
    slippage,
  ]);

  const total = useMemo(() => {
    if (data) {
      return items.reduce((acc, item) => {
        const dataForItem = data.get(itemKey(item));
        return item.action === "buy"
          ? acc.minus(dataForItem?.sum ?? 0)
          : acc.plus(dataForItem?.sum ?? 0);
      }, new Decimal(0));
    }
    return new Decimal(0);
  }, [data]);

  const transaction: SubmittableExtrinsic<
    "promise",
    ISubmittableResult
  > | null = useMemo(() => {
    if (data && sdk && isRpcSdk(sdk)) {
      const transactions = items
        .map((item) => {
          const state = data.get(itemKey(item));

          if (!state) return null;

          const amount = new Decimal(item.amount).mul(ZTG);

          const { asset, pool, poolZtgBalance, poolAssetBalance } = state;

          const assetWeight = getAssetWeight(pool, asset.assetId).unwrap();
          const ztgWeight = getAssetWeight(pool, { Ztg: null }).unwrap();

          if (item.action == "buy") {
            const maxAmountIn = calcInGivenOut(
              poolZtgBalance,
              ztgWeight,
              poolAssetBalance,
              assetWeight,
              amount,
              state.swapFee.div(ZTG),
            ).mul(new Decimal(slippage / 100 + 1));

            if (maxAmountIn.isNaN()) {
              return null;
            }

            return sdk.context.api.tx.swaps.swapExactAmountOut(
              pool.poolId,
              asset.assetId,
              maxAmountIn.toFixed(0),
              asset.assetId,
              amount.toFixed(0),
              null,
            );
          } else {
            const minAmountOut = calcOutGivenIn(
              poolAssetBalance,
              assetWeight,
              poolZtgBalance,
              ztgWeight,
              amount.toNumber(),
              state.swapFee.div(ZTG),
            ).mul(new Decimal(1 - slippage / 100));

            return sdk.context.api.tx.swaps.swapExactAmountIn(
              pool.poolId,
              asset.assetId,
              amount.toFixed(0),
              { Ztg: null },
              minAmountOut.toFixed(0),
              null,
            );
          }
        })
        .filter(
          (
            a: null | SubmittableExtrinsic<"promise", ISubmittableResult>,
          ): a is SubmittableExtrinsic<"promise", ISubmittableResult> =>
            a !== null,
        );

      if (transactions.length) {
        return sdk.context.api.tx.utility.batch(transactions);
      }

      return null;
    }

    return null;
  }, [data, sdk, slippage]);

  const { data: transactionFees } = useQuery(
    [id, items, data],
    async () => {
      return new Decimal(
        (
          await transaction?.paymentInfo(signer.address)
        ).partialFee.toNumber() ?? 0,
      );
    },
    {
      initialData: new Decimal(0),
      enabled: Boolean(transaction),
    },
  );

  const get = (key: TradeSlipItemDataKey) => data.get(key);

  return {
    get,
    total,
    transaction,
    transactionFees,
  };
};
