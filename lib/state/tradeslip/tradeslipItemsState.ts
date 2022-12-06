import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQueries } from "@tanstack/react-query";
import {
  Context,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  IndexerContext,
  isNA,
  isRpcSdk,
  Market,
  na,
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
import { TradeSlipItem } from "./items";
import { slippagePercentageAtom } from "./slippage";

/**
 * State pr trade slip item that contains computed and related remote data.
 */
export type TradeSlipItemState = {
  /**
   * The item the state is for.
   */
  item: TradeSlipItem;
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
  traderAssetBalance: Decimal | NA;
  /**
   * Free balance the pool has of the items asset.
   */
  poolAssetBalance: Decimal;
  /**
   * Amount of tradable assets in the pool.
   */
  tradeablePoolBalance: Decimal;
  /**
   * The sum cost/gain for the buy or sell.
   */
  sum: Decimal;
  /**
   * The max ammount the trader can buy or sell. Depends on the item action.
   */
  max: Decimal;
  /**
   * Transaction for the item.
   */
  transaction: SubmittableExtrinsic<"promise", ISubmittableResult>;
};

/**
 * Composite id/key for a certain item by its assetid and action.
 */
export type TradeSlipItemStateKey = string & { readonly _tag: unique symbol };

/**
 * Identify a TradeSlipItem by its action and asset id.
 *
 * @param item TradeSlipItem
 * @returns string
 */
export const itemKey = (item: TradeSlipItem): TradeSlipItemStateKey =>
  `${item.action}|${JSON.stringify(item.assetId)}` as TradeSlipItemStateKey;

/**
 * Rootkey for trade slip item state query cache.
 */
export const rootKey = "trade-slip-item-state";

/**
 * Get the state for a singel trade slip item.
 *
 * @param item TradeSlipItem
 * @returns TradeSlipItemState | null
 */
export const useTradeslipItemState = (
  item: TradeSlipItem,
): TradeSlipItemState | null => {
  const states = useTradeslipItemsState([item]);
  return states[itemKey(item)];
};

/**
 * Returns remote and computed state pr trade slip item like max amount, sum, market, asset
 * the transaction etc.
 *
 * @param items TradeSlipItem[]
 * @returns UseTradeslipItemsState
 */
export const useTradeslipItemsState = (
  items: TradeSlipItem[],
): Record<TradeSlipItemStateKey, TradeSlipItemState> => {
  const [sdk, id] = useSdkv2();
  const { wallets } = useStore();
  const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;

  const [slippage] = useAtom(slippagePercentageAtom);

  const { data: traderZtgBalance } = useZtgBalance(signer);

  const { data: pools } = usePoolsByIds(
    items.map((item) => ({ marketId: getMarketIdOf(item.assetId) })),
  );

  const { data: saturatedIndex } = useSaturatedPoolsIndex(pools || []);

  const poolZtgBalances = usePoolZtgBalance(pools ?? []);

  const traderAssets = useAccountAssetBalances(
    items.map((item) => ({
      account: signer?.address,
      assetId: item.assetId,
    })),
  );

  const poolAssetBalances = useAccountAssetBalances(
    items.map((item) => ({
      account: pools?.find((p) => p.marketId == getMarketIdOf(item.assetId))
        ?.accountId,
      assetId: item.assetId,
    })),
  );

  const balancesKey = {
    traderZtgBalance: traderZtgBalance.toString(),
    traderAssets: traderAssets?.map((a) => a?.toString()),
  };

  const query = useQueries({
    queries: items.map((item) => {
      const pool = pools?.find(
        (p) => p.marketId == getMarketIdOf(item.assetId),
      );

      const amount = new Decimal(item.amount).mul(ZTG);
      const assetIndex = getIndexOf(item.assetId);
      const saturatedData = saturatedIndex?.[pool?.poolId];
      const asset = saturatedData?.assets[assetIndex];
      const market = saturatedData?.market;

      const ztgWeight = pool
        ? getAssetWeight(pool, { Ztg: null }).unwrap()
        : null;

      const assetWeight = asset
        ? getAssetWeight(pool, asset?.assetId).unwrap()
        : null;

      const swapFee = pool?.swapFee
        ? new Decimal(pool.swapFee)
        : new Decimal(0);

      const poolZtgBalance =
        !poolZtgBalances[0] || isNA(poolZtgBalances[0])
          ? null
          : new Decimal(poolZtgBalances[0].balance.data.free.toString());

      const traderAssetBalance =
        !traderAssets?.[0] || isNA(traderAssets?.[0])
          ? na("Account balance not available.")
          : new Decimal(traderAssets?.[0].free.toString());

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

      return {
        enabled: Boolean(sdk) && isRpcSdk(sdk) && enabled,
        keepPreviousData: true,
        queryKey: [
          id,
          rootKey,
          itemKey(item),
          amount,
          signer?.address,
          balancesKey,
        ],
        queryFn: async () => {
          if (!enabled || !sdk || !isRpcSdk(sdk)) {
            return null;
          }

          const max = (() => {
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
              if (!traderAssetBalance || isNA(traderAssetBalance)) {
                return tradeablePoolBalance;
              }
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

          let transaction: SubmittableExtrinsic<"promise", ISubmittableResult>;

          try {
            if (item.action == "buy") {
              const maxAmountIn = calcInGivenOut(
                poolZtgBalance,
                ztgWeight,
                poolAssetBalance,
                assetWeight,
                amount,
                swapFee.div(ZTG),
              ).mul(new Decimal(slippage / 100 + 1));

              if (!maxAmountIn.isNaN()) {
                transaction = sdk.context.api.tx.swaps.swapExactAmountOut(
                  pool.poolId,
                  { Ztg: null },
                  maxAmountIn.toFixed(0),
                  asset.assetId,
                  amount.toFixed(0),
                  null,
                );
              }
            } else {
              const minAmountOut = calcOutGivenIn(
                poolAssetBalance,
                assetWeight,
                poolZtgBalance,
                ztgWeight,
                amount.toNumber(),
                swapFee.div(ZTG),
              ).mul(new Decimal(1 - slippage / 100));

              if (!minAmountOut.isNaN) {
                transaction = sdk.context.api.tx.swaps.swapExactAmountIn(
                  pool.poolId,
                  asset.assetId,
                  amount.toFixed(0),
                  { Ztg: null },
                  minAmountOut.toFixed(0),
                  null,
                );
              }
            }
          } catch (error) {
            return null;
          }

          return {
            item,
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
            transaction,
          };
        },
      };
    }),
  });

  return query.reduce<Record<TradeSlipItemStateKey, TradeSlipItemState>>(
    (index, { data: state }) => {
      if (!state) return index;
      return {
        ...index,
        [itemKey(state.item)]: state,
      };
    },
    {},
  );
};
