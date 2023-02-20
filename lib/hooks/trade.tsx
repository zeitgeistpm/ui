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
import { createContext, useState } from "react";
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
  baseAmount?: Decimal;
};

export const TradeItemContext = createContext<{
  data: TradeItem | null;
  set: (trade: TradeItem) => void;
}>(null);

export const useTrade = () => {
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

export type UseTradeItemState = {
  readonly item: TradeItem | null;
};

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
    [id, "trade", item, wallets.activeAccount?.address],
    () => {
      const baseWeight = getAssetWeight(pool, { Ztg: null }).unwrap();
      const assetWeight = getAssetWeight(pool, item.assetId).unwrap();
      const assetIndex = getIndexOf(item.assetId);
      const asset = saturatedData.assets[assetIndex];
      const market = saturatedData.market;
      const swapFee = new Decimal(pool.swapFee === "" ? "0" : pool.swapFee);

      const price = calcSpotPrice(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        swapFee,
      );

      let maxAmountBase =
        item.action === "buy"
          ? calcInGivenOut(
              poolBaseBalance,
              baseWeight,
              poolAssetBalance,
              assetWeight,
              poolAssetBalance.mul(MAX_IN_OUT_RATIO),
              swapFee,
            )
          : calcOutGivenIn(
              poolAssetBalance,
              assetWeight,
              poolBaseBalance,
              baseWeight,
              traderAssetBalance,
              swapFee,
            );

      maxAmountBase = isNA(traderBaseBalance)
        ? new Decimal(0)
        : maxAmountBase.gt(traderBaseBalance)
        ? traderBaseBalance
        : maxAmountBase;

      let amountAsset =
        item.action === "buy"
          ? calcOutGivenIn(
              poolBaseBalance,
              baseWeight,
              poolAssetBalance,
              assetWeight,
              item.baseAmount ?? 0,
              swapFee,
            )
          : calcInGivenOut(
              poolAssetBalance,
              assetWeight,
              poolBaseBalance,
              baseWeight,
              item.baseAmount ?? 0,
              swapFee,
            );

      const priceAfterTrade =
        item.action === "buy"
          ? calcSpotPrice(
              poolBaseBalance.add(item.baseAmount ?? 0),
              baseWeight,
              poolAssetBalance.sub(amountAsset),
              assetWeight,
              swapFee,
            )
          : calcSpotPrice(
              poolBaseBalance.sub(item.baseAmount ?? 0),
              baseWeight,
              poolAssetBalance.add(amountAsset),
              assetWeight,
              swapFee,
            );

      let transaction: SubmittableExtrinsic<
        "promise",
        ISubmittableResult
      > | null;

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
                maxAmountIn.floor().toFixed(0),
                item.assetId,
                amountAsset.toFixed(0),
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
                amountAsset.toFixed(0),
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
      return {
        item,
        asset,
        market,
        baseAmount: item.baseAmount,
        assetAmount: amountAsset,
        maxBaseAmount: maxAmountBase.toDecimalPlaces(0),
        priceAfterTrade,
        price,
        transaction,
      };
    },
    {
      enabled:
        !!sdk &&
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
