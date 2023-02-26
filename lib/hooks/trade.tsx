import { useQuery } from "@tanstack/react-query";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import {
  CategoricalAssetId,
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  isNA,
  isRpcSdk,
  SaturatedPoolEntryAsset,
  ScalarAssetId,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { MAX_IN_OUT_RATIO } from "lib/constants";
import { calcInGivenOut, calcOutGivenIn, calcSpotPrice } from "lib/math";
import { useStore } from "lib/stores/Store";
import { TradeType } from "lib/types";
import { createContext } from "react";
import { useAccountAssetBalances } from "./queries/useAccountAssetBalances";
import { usePoolAccountIds } from "./queries/usePoolAccountIds";
import { usePoolsByIds } from "./queries/usePoolsByIds";
import { usePoolZtgBalance } from "./queries/usePoolZtgBalance";
import { useSaturatedPoolsIndex } from "./queries/useSaturatedPoolsIndex";
import { useZtgBalance } from "./queries/useZtgBalance";
import { useSdkv2 } from "./useSdkv2";
import { useContext } from "react";

export type TradeItem = {
  action: TradeType;
  assetId: CategoricalAssetId | ScalarAssetId;
};

export const TradeItemContext = createContext<{
  data: TradeItem | null;
  set: (trade: TradeItem) => void;
}>(null);

export const useTradeItem = () => {
  return useContext(TradeItemContext);
};

/**
 * Atom storage for trade slippage percentage.
 * @persistent - local
 */
export const slippagePercentageAtom = atomWithStorage<number>(
  "trade-slippage-percentage",
  1,
);

export const useTradeMaxBaseAmount = (item: TradeItem): Decimal => {
  const { data: itemState } = useTradeItemState(item);

  if (!itemState) {
    return new Decimal(0);
  }

  const {
    poolAssetBalance,
    baseWeight,
    poolBaseBalance,
    assetWeight,
    tradeablePoolAssetBalance,
    swapFee,
    traderAssetBalance,
    traderBaseBalance,
  } = itemState;

  let maxAmountBase: Decimal;

  if (item.action === "buy") {
    maxAmountBase = calcInGivenOut(
      poolBaseBalance,
      baseWeight,
      poolAssetBalance,
      assetWeight,
      tradeablePoolAssetBalance,
      swapFee,
    );
  }
  if (item.action === "sell") {
    const assetBalance = traderAssetBalance.gt(tradeablePoolAssetBalance)
      ? tradeablePoolAssetBalance
      : traderAssetBalance;

    maxAmountBase = calcOutGivenIn(
      poolAssetBalance,
      assetWeight,
      poolBaseBalance,
      baseWeight,
      assetBalance,
      swapFee,
    );
  }

  maxAmountBase = isNA(traderBaseBalance)
    ? new Decimal(0)
    : maxAmountBase.gt(traderBaseBalance)
    ? traderBaseBalance
    : maxAmountBase;

  return maxAmountBase;
};

export const useTradeMaxAssetAmount = (item: TradeItem): Decimal => {
  const { data: itemState } = useTradeItemState(item);

  const maxBaseAmount = useTradeMaxBaseAmount(item);

  if (!itemState) {
    return new Decimal(0);
  }

  const {
    poolAssetBalance,
    baseWeight,
    poolBaseBalance,
    assetWeight,
    tradeablePoolAssetBalance,
    swapFee,
    traderBaseBalance,
  } = itemState;

  let maxAmountAsset: Decimal;

  if (item.action === "buy") {
    maxAmountAsset = calcOutGivenIn(
      poolBaseBalance,
      baseWeight,
      poolAssetBalance,
      assetWeight,
      maxBaseAmount,
      swapFee,
    );
  }
  if (item.action === "sell") {
    maxAmountAsset = calcInGivenOut(
      poolAssetBalance,
      assetWeight,
      poolBaseBalance,
      baseWeight,
      maxBaseAmount,
      swapFee,
    );
  }

  maxAmountAsset = isNA(traderBaseBalance)
    ? new Decimal(0)
    : maxAmountAsset.gt(tradeablePoolAssetBalance)
    ? tradeablePoolAssetBalance
    : maxAmountAsset;

  return maxAmountAsset;
};

export const useTradeTransaction = (
  item: TradeItem,
  amountAsset?: string,
): SubmittableExtrinsic<"promise", ISubmittableResult> | undefined => {
  amountAsset = !amountAsset ? "0" : amountAsset;
  const amountAssetDecimal = new Decimal(amountAsset).mul(ZTG);
  const [sdk] = useSdkv2();
  const { data: itemState } = useTradeItemState(item);

  if (itemState == null || sdk == null) {
    return undefined;
  }

  const {
    pool,
    poolAssetBalance,
    baseWeight,
    poolBaseBalance,
    assetWeight,
    swapFee,
    slippage,
  } = itemState;

  let transaction: SubmittableExtrinsic<"promise", ISubmittableResult> | null;

  if (isRpcSdk(sdk)) {
    try {
      if (item.action == "buy") {
        const maxAmountIn = calcInGivenOut(
          poolBaseBalance,
          baseWeight,
          poolAssetBalance,
          assetWeight,
          amountAsset,
          swapFee,
        ).mul(new Decimal(slippage / 100 + 1));

        if (!maxAmountIn.isNaN()) {
          transaction = sdk.api.tx.swaps.swapExactAmountOut(
            pool.poolId,
            { Ztg: null },
            maxAmountIn.round().toFixed(0),
            item.assetId,
            amountAssetDecimal.toFixed(0),
            null,
          );
        }
      } else {
        const minAmountOut = calcOutGivenIn(
          poolAssetBalance,
          assetWeight,
          poolBaseBalance,
          baseWeight,
          amountAsset,
          swapFee,
        ).mul(new Decimal(1 - slippage / 100));

        if (!minAmountOut.isNaN()) {
          transaction = sdk.api.tx.swaps.swapExactAmountIn(
            pool.poolId,
            item.assetId,
            amountAssetDecimal.toFixed(0),
            { Ztg: null },
            minAmountOut.round().toFixed(0),
            null,
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  return transaction;
};

// returns all teh necessary data needed for trade
export const useTradeItemState = (item: TradeItem) => {
  const [sdk, id] = useSdkv2();
  const { wallets } = useStore();
  const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;
  const [slippage] = useAtom(slippagePercentageAtom);

  const { data: traderBaseBalance } = useZtgBalance(
    wallets.activeAccount?.address,
  );

  const { data: pools } = usePoolsByIds([
    { marketId: getMarketIdOf(item.assetId) },
  ]);

  const pool = pools?.[0];

  const { data: saturatedIndex } = useSaturatedPoolsIndex(pools ?? []);
  const saturatedData = saturatedIndex?.[pool?.poolId];

  const poolBaseBalances = usePoolZtgBalance(pools ?? []);
  const poolBaseBalance =
    pool &&
    poolBaseBalances?.[pool?.poolId] &&
    new Decimal(poolBaseBalances[pool.poolId].free.toString());

  const traderAssets = useAccountAssetBalances([
    { account: signer?.address, assetId: item.assetId },
  ]);
  const traderAssetBalance = new Decimal(
    (
      traderAssets?.get(signer?.address, item.assetId)?.data?.balance as any
    )?.free?.toString() ?? 0,
  );

  const poolAccountIds = usePoolAccountIds(pools ?? []);
  const poolAccountId = poolAccountIds[pool?.poolId];

  const poolAssetBalances = useAccountAssetBalances([
    { account: poolAccountId, assetId: item.assetId },
  ]);

  const poolAssetBalance = new Decimal(
    (
      poolAssetBalances?.get(poolAccountId, item.assetId)?.data.balance as any
    ).free?.toString() ?? 0,
  );

  const query = useQuery(
    [id, "trade-item-state", item, wallets.activeAccount?.address],
    () => {
      const baseWeight = getAssetWeight(pool, { Ztg: null }).unwrap();
      const assetWeight = getAssetWeight(pool, item.assetId).unwrap();
      const assetIndex = getIndexOf(item.assetId);
      const asset = saturatedData.assets[assetIndex];
      const market = saturatedData.market;
      const swapFee = new Decimal(pool.swapFee === "" ? "0" : pool.swapFee).div(
        ZTG,
      );
      const tradeablePoolAssetBalance = poolAssetBalance.mul(MAX_IN_OUT_RATIO);

      const spotPrice = calcSpotPrice(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        swapFee,
      );

      return {
        asset,
        market,
        pool,
        spotPrice,
        poolBaseBalance,
        poolAssetBalance,
        tradeablePoolAssetBalance,
        traderBaseBalance,
        traderAssetBalance,
        baseWeight,
        assetWeight,
        swapFee,
        slippage,
      };
    },
    {
      enabled:
        !!sdk &&
        !!item &&
        !!pool &&
        !!poolBaseBalance &&
        !!saturatedData &&
        !!traderBaseBalance &&
        !!traderAssetBalance &&
        !!poolAssetBalance &&
        !!wallets.activeAccount?.address,
      keepPreviousData: true,
    },
  );

  return query;
};
