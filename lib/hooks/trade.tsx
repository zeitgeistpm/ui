import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import {
  AssetId,
  CategoricalAssetId,
  IOForeignAssetId,
  IOMarketOutcomeAssetId,
  IOZtgAssetId,
  isRpcSdk,
  ScalarAssetId,
  ZTG,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calcInGivenOut, calcOutGivenIn } from "lib/math";
import { TradeType } from "lib/types";
import { createContext, useContext } from "react";
import { useTradeItemState } from "./queries/useTradeItemState";
import { useSdkv2 } from "./useSdkv2";
import { perbillToNumber } from "lib/util/perbill-to-number";

export type TradeItem = {
  action: TradeType;
  assetId: CategoricalAssetId | ScalarAssetId;
};

export const TradeItemContext = createContext<{
  data: TradeItem | null;
  set: (trade: TradeItem) => void;
}>({
  data: null,
  set: () => {},
});

export const useTradeItem = () => {
  return useContext(TradeItemContext);
};

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
    market,
  } = itemState;

  let maxAmountBase: Decimal = new Decimal(0);

  if (!traderBaseBalance) {
    return maxAmountBase;
  }

  if (item.action === "buy") {
    maxAmountBase = calcInGivenOut(
      poolBaseBalance,
      baseWeight,
      poolAssetBalance,
      assetWeight,
      tradeablePoolAssetBalance,
      swapFee,
      perbillToNumber(market.creatorFee ?? 0),
    );
    return maxAmountBase.gt(traderBaseBalance)
      ? traderBaseBalance
      : maxAmountBase;
  }
  if (item.action === "sell") {
    const maxAssetIn = traderAssetBalance.gt(tradeablePoolAssetBalance)
      ? tradeablePoolAssetBalance
      : traderAssetBalance;

    maxAmountBase = calcOutGivenIn(
      poolAssetBalance,
      assetWeight,
      poolBaseBalance,
      baseWeight,
      maxAssetIn,
      swapFee,
      perbillToNumber(market.creatorFee ?? 0),
    );
    return maxAmountBase;
  }

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
    market,
  } = itemState;

  let maxAmountAsset: Decimal = new Decimal(0);

  if (item.action === "buy") {
    maxAmountAsset = calcOutGivenIn(
      poolBaseBalance,
      baseWeight,
      poolAssetBalance,
      assetWeight,
      maxBaseAmount,
      swapFee,
      perbillToNumber(market.creatorFee ?? 0),
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
      perbillToNumber(market.creatorFee ?? 0),
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
  exactAmountAssetId: AssetId,
  amount: string,
): SubmittableExtrinsic<"promise", ISubmittableResult> | undefined => {
  const [sdk] = useSdkv2();
  const { data: itemState } = useTradeItemState(item);

  if (itemState == null || sdk == null || !isRpcSdk(sdk)) {
    return undefined;
  }
  amount = !amount ? "0" : amount;
  const amountDecimal = new Decimal(amount).mul(ZTG);

  const {
    pool,
    poolAssetBalance,
    baseWeight,
    poolBaseBalance,
    assetWeight,
    swapFee,
    slippage,
    baseAssetId,
    assetId,
    market,
  } = itemState;

  let transaction:
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | undefined;

  if (item.action === "buy") {
    const inAssetId = baseAssetId;
    const outAssetId = assetId;
    if (
      IOZtgAssetId.is(exactAmountAssetId) ||
      IOForeignAssetId.is(exactAmountAssetId)
    ) {
      const minAmountOut = calcOutGivenIn(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        amountDecimal,
        swapFee,
        perbillToNumber(market.creatorFee ?? 0),
      ).mul(new Decimal(1 - slippage / 100));

      if (!minAmountOut.isNaN() && minAmountOut.greaterThanOrEqualTo(0)) {
        transaction = sdk.api.tx.swaps.swapExactAmountIn(
          pool.poolId,
          inAssetId,
          amountDecimal.toFixed(0),
          outAssetId,
          minAmountOut.toFixed(0, Decimal.ROUND_DOWN),
          null,
        );
      }
    } else if (IOMarketOutcomeAssetId.is(exactAmountAssetId)) {
      const maxAmountIn = calcInGivenOut(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        amountDecimal,
        swapFee,
        perbillToNumber(market.creatorFee ?? 0),
      ).mul(new Decimal(slippage / 100 + 1));

      if (!maxAmountIn.isNaN() && maxAmountIn.greaterThanOrEqualTo(0)) {
        transaction = sdk.api.tx.swaps.swapExactAmountOut(
          pool.poolId,
          inAssetId,
          maxAmountIn.toFixed(0, Decimal.ROUND_UP),
          outAssetId,
          amountDecimal.toFixed(0),
          null,
        );
      }
    }
  } else if (item.action === "sell") {
    const inAssetId = assetId;
    const outAssetId = baseAssetId;

    if (
      IOZtgAssetId.is(exactAmountAssetId) ||
      IOForeignAssetId.is(exactAmountAssetId)
    ) {
      const maxAmountIn = calcInGivenOut(
        poolAssetBalance,
        assetWeight,
        poolBaseBalance,
        baseWeight,
        amountDecimal,
        swapFee,
        perbillToNumber(market.creatorFee ?? 0),
      ).mul(new Decimal(slippage / 100 + 1));

      if (!maxAmountIn.isNaN() && maxAmountIn.greaterThanOrEqualTo(0)) {
        transaction = sdk.api.tx.swaps.swapExactAmountOut(
          pool.poolId,
          inAssetId,
          maxAmountIn.toFixed(0, Decimal.ROUND_UP),
          outAssetId,
          amountDecimal.toFixed(0),
          null,
        );
      }
    } else if (IOMarketOutcomeAssetId.is(exactAmountAssetId)) {
      const minAmountOut = calcOutGivenIn(
        poolAssetBalance,
        assetWeight,
        poolBaseBalance,
        baseWeight,
        amountDecimal,
        swapFee,
        perbillToNumber(market.creatorFee ?? 0),
      ).mul(new Decimal(1 - slippage / 100));

      if (!minAmountOut.isNaN() && minAmountOut.greaterThanOrEqualTo(0)) {
        transaction = sdk.api.tx.swaps.swapExactAmountIn(
          pool.poolId,
          inAssetId,
          amountDecimal.toFixed(0),
          outAssetId,
          minAmountOut.toFixed(0, Decimal.ROUND_DOWN),
          null,
        );
      }
    }
  }

  return transaction;
};
