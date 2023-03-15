import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import {
  CategoricalAssetId,
  isRpcSdk,
  ScalarAssetId,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { atomWithStorage } from "jotai/utils";
import { calcInGivenOut, calcOutGivenIn, calcSpotPrice } from "lib/math";
import { TradeType } from "lib/types";
import { createContext } from "react";
import { useSdkv2 } from "./useSdkv2";
import { useContext } from "react";
import { useTradeItemState } from "./queries/useTradeItemState";

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

  maxAmountBase =
    traderBaseBalance == null
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

  maxAmountAsset =
    traderBaseBalance == null
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

  let transaction:
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | undefined;

  if (isRpcSdk(sdk)) {
    if (item.action == "buy") {
      const maxAmountIn = calcInGivenOut(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        amountAssetDecimal,
        swapFee,
      ).mul(new Decimal(slippage / 100 + 1));

      if (!maxAmountIn.isNaN()) {
        transaction = sdk.api.tx.swaps.swapExactAmountOut(
          pool.poolId,
          { Ztg: null },
          maxAmountIn.toFixed(0),
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
        amountAssetDecimal,
        swapFee,
      ).mul(new Decimal(1 - slippage / 100));

      if (!minAmountOut.isNaN()) {
        transaction = sdk.api.tx.swaps.swapExactAmountIn(
          pool.poolId,
          item.assetId,
          amountAssetDecimal.toFixed(0),
          { Ztg: null },
          minAmountOut.toFixed(0),
          null,
        );
      }
    }
  }

  return transaction;
};
