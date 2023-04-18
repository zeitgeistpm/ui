import { Tab } from "@headlessui/react";
import {
  AssetId,
  ZTG,
  IOMarketOutcomeAssetId,
  IOZtgAssetId,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import {
  useTradeItem,
  useTradeMaxAssetAmount,
  useTradeMaxBaseAmount,
  useTradeTransaction,
} from "lib/hooks/trade";
import { ISubmittableResult } from "@polkadot/types/types";
import { useNotifications } from "lib/state/notifications";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { capitalize } from "lodash";
import { from } from "rxjs";
import { useDebounce } from "use-debounce";
import RangeInput from "../ui/RangeInput";
import TransactionButton from "../ui/TransactionButton";
import TradeTab, { TradeTabType } from "./TradeTab";
import { useForm } from "react-hook-form";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useTradeItemState } from "lib/hooks/queries/useTradeItemState";
import { calcInGivenOut, calcOutGivenIn, calcSpotPrice } from "lib/math";
import TradeResult from "components/markets/TradeResult";
import { useWallet } from "lib/state/wallet";
import { TradeType } from "lib/types";

const getTradeValuesFromExtrinsicResult = (
  type: TradeType,
  data: ISubmittableResult,
): { baseAmount: string; assetAmount: string } => {
  let baseAsset = new Decimal(0);
  let outcome = new Decimal(0);
  const { events } = data;
  for (const eventData of events) {
    const { event } = eventData;
    const { data } = event;
    if (
      event.method === "SwapExactAmountIn" ||
      event.method === "SwapExactAmountOut"
    ) {
      if (type === "buy") {
        baseAsset = baseAsset.add(data[0]["assetAmountIn"].toPrimitive());
        outcome = outcome.add(data[0]["assetAmountOut"].toPrimitive());
      } else {
        baseAsset = baseAsset.add(data[0]["assetAmountOut"].toPrimitive());
        outcome = outcome.add(data[0]["assetAmountIn"].toPrimitive());
      }
    }
  }
  return {
    baseAmount: baseAsset.div(ZTG).toFixed(1),
    assetAmount: outcome.div(ZTG).toFixed(1),
  };
};

const TradeForm = observer(() => {
  const notifications = useNotifications();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const { register, formState, watch, setValue, reset } = useForm<{
    percentage: string;
    assetAmount: string;
    baseAmount: string;
  }>({
    defaultValues: { percentage: "0", assetAmount: "0", baseAmount: "0" },
  });

  const store = useStore();
  const wallet = useWallet();
  const signer = wallet.getActiveSigner();

  const { data: tradeItem, set: setTradeItem } = useTradeItem();
  const { data: tradeItemState } = useTradeItemState(tradeItem);

  const {
    poolBaseBalance,
    baseWeight,
    assetWeight,
    poolAssetBalance,
    swapFee,
  } = tradeItemState ?? {};

  const maxBaseAmount = useTradeMaxBaseAmount(tradeItem);
  const maxAssetAmount = useTradeMaxAssetAmount(tradeItem);

  const maxBaseAmountDecimal = new Decimal(maxBaseAmount ?? 0).div(ZTG);
  const maxAssetAmountDecimal = new Decimal(maxAssetAmount ?? 0).div(ZTG);

  const [fee, setFee] = useState<string>("0.00");
  const [percentageDisplay, setPercentageDisplay] = useState<string>("0");
  const baseSymbol = tradeItemState?.pool.baseAsset.toUpperCase() ?? "ZTG";

  const type = tradeItem.action;

  const assetAmount = watch("assetAmount");
  const baseAmount = watch("baseAmount");

  const [finalAmounts, setFinalAmounts] = useState<{
    asset: string;
    base: string;
  }>({ asset: "0", base: "0" });

  const averagePrice = useMemo<string>(() => {
    if (!Number(assetAmount) || !Number(baseAmount)) {
      return "0";
    } else return new Decimal(baseAmount).div(assetAmount).toFixed(2);
  }, [assetAmount, baseAmount]);

  const predictionAfterTrade = useMemo<Decimal>(() => {
    if (!Number(assetAmount) || !Number(baseAmount) || tradeItemState == null) {
      return new Decimal(0);
    } else {
      if (tradeItem.action === "buy") {
        return calcSpotPrice(
          tradeItemState.poolBaseBalance.add(new Decimal(baseAmount).mul(ZTG)),
          tradeItemState.baseWeight,
          tradeItemState.poolAssetBalance.sub(
            new Decimal(assetAmount).mul(ZTG),
          ),
          tradeItemState.assetWeight,
          tradeItemState.swapFee,
        );
      } else {
        return calcSpotPrice(
          tradeItemState.poolBaseBalance.sub(new Decimal(baseAmount).mul(ZTG)),
          tradeItemState.baseWeight,
          tradeItemState.poolAssetBalance.add(
            new Decimal(assetAmount).mul(ZTG),
          ),
          tradeItemState.assetWeight,
          tradeItemState.swapFee,
        );
      }
    }
  }, [assetAmount, baseAmount, tradeItemState]);

  const priceImpact = useMemo<string>(() => {
    if (tradeItemState == null || predictionAfterTrade.eq(0)) {
      return "0";
    } else {
      return predictionAfterTrade
        .div(tradeItemState.spotPrice)
        .sub(1)
        .mul(100)
        .toFixed(2);
    }
  }, [tradeItemState, predictionAfterTrade]);

  const [lastEditedAssetId, setLastEditedAssetId] = useState<AssetId>(
    tradeItem.assetId,
  );

  const transaction = useTradeTransaction(
    tradeItem,
    lastEditedAssetId,
    IOMarketOutcomeAssetId.is(lastEditedAssetId) ? assetAmount : baseAmount,
  );

  const {
    send: swapTx,
    isSuccess,
    isLoading,
  } = useExtrinsic(() => transaction, {
    onSuccess: (data) => {
      const { baseAmount, assetAmount } = getTradeValuesFromExtrinsicResult(
        type,
        data,
      );
      notifications.pushNotification(
        `Successfully ${
          tradeItem.action === "buy" ? "bought" : "sold"
        } ${assetAmount} ${
          tradeItemState.asset.category.ticker
        } for ${baseAmount} ${baseSymbol}`,
        { type: "Success", lifetime: 60 },
      );

      setFinalAmounts({ asset: assetAmount, base: baseAmount });
      setPercentageDisplay("0");
    },
  });

  const [debouncedTransactionHash] = useDebounce(
    transaction?.hash.toString(),
    150,
  );

  useEffect(() => {
    if (debouncedTransactionHash == null) {
      return;
    }
    const sub = from(transaction.paymentInfo(signer.address)).subscribe(
      (fee) => {
        setFee(new Decimal(fee.partialFee.toString()).div(ZTG).toFixed(3));
      },
    );
    return () => sub.unsubscribe();
  }, [debouncedTransactionHash]);

  const changeByPercentage = useCallback(
    (percentage: Decimal) => {
      if (tradeItemState == null) {
        return;
      }
      if (tradeItem.action === "buy") {
        const amountOut = maxAssetAmountDecimal.mul(percentage);

        const [balanceIn, weightIn, balanceOut, weightOut] = [
          poolBaseBalance,
          baseWeight,
          poolAssetBalance,
          assetWeight,
        ];

        const amountIn = calcInGivenOut(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          amountOut.mul(ZTG),
          tradeItemState.swapFee,
        );

        setValue(
          "baseAmount",
          amountIn.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setValue("assetAmount", amountOut.toFixed(4, Decimal.ROUND_DOWN));
      } else if (tradeItem.action === "sell") {
        const amountOut = maxBaseAmountDecimal.mul(percentage);

        const [balanceIn, weightIn, balanceOut, weightOut] = [
          poolBaseBalance,
          baseWeight,
          poolAssetBalance,
          assetWeight,
        ];

        const amountIn = calcInGivenOut(
          balanceOut,
          weightOut,
          balanceIn,
          weightIn,
          amountOut.mul(ZTG),
          tradeItemState.swapFee,
        );

        setValue("baseAmount", amountOut.toFixed(4, Decimal.ROUND_DOWN));
        setValue(
          "assetAmount",
          amountIn.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
      }
    },
    [
      tradeItem?.action,
      maxBaseAmount.toString(),
      maxAssetAmount.toString(),
      tradeItemState,
    ],
  );

  const changeByAssetAmount = useCallback(
    (assetAmount: Decimal) => {
      if (tradeItemState == null) {
        return;
      }

      const percentage = maxAssetAmountDecimal.gt(0)
        ? assetAmount.div(maxAssetAmountDecimal).mul(100).toDecimalPlaces(0)
        : new Decimal(0);

      if (tradeItem.action === "buy") {
        const [balanceIn, weightIn, balanceOut, weightOut] = [
          poolBaseBalance,
          baseWeight,
          poolAssetBalance,
          assetWeight,
        ];
        const amountIn = calcInGivenOut(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          assetAmount.mul(ZTG),
          swapFee,
        );

        setValue(
          "baseAmount",
          amountIn.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setPercentageDisplay(percentage.toString());
      } else if (tradeItem.action === "sell") {
        const [balanceIn, weightIn, balanceOut, weightOut] = [
          poolAssetBalance,
          assetWeight,
          poolBaseBalance,
          baseWeight,
        ];

        const amountOut = calcOutGivenIn(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          assetAmount.mul(ZTG),
          swapFee,
        );
        setValue(
          "baseAmount",
          amountOut.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setPercentageDisplay(percentage.toString());
      }
    },
    [
      maxBaseAmount.toString(),
      maxAssetAmount.toString(),
      tradeItem.action,
      tradeItemState,
    ],
  );

  const changeByBaseAmount = useCallback(
    (baseAmount: Decimal) => {
      if (tradeItemState == null) {
        return;
      }
      const {
        poolBaseBalance,
        baseWeight,
        assetWeight,
        poolAssetBalance,
        swapFee,
      } = tradeItemState;

      const percentage = maxBaseAmountDecimal.gt(0)
        ? baseAmount.div(maxBaseAmountDecimal).mul(100).toDecimalPlaces(0)
        : new Decimal(0);

      if (tradeItem.action === "buy") {
        const [balanceIn, weightIn, balanceOut, weightOut] = [
          poolBaseBalance,
          baseWeight,
          poolAssetBalance,
          assetWeight,
        ];

        const amountOut = calcOutGivenIn(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          baseAmount.mul(ZTG),
          swapFee,
        );
        setValue(
          "assetAmount",
          amountOut.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setPercentageDisplay(percentage.toString());
      } else if (tradeItem.action === "sell") {
        const [balanceIn, weightIn, balanceOut, weightOut] = [
          poolAssetBalance,
          assetWeight,
          poolBaseBalance,
          baseWeight,
        ];

        const amountIn = calcInGivenOut(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          baseAmount.mul(ZTG),
          swapFee,
        );

        setValue(
          "assetAmount",
          amountIn.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setPercentageDisplay(percentage.toString());
      }
    },
    [
      maxBaseAmount.toString(),
      maxAssetAmount.toString(),
      tradeItem.action,
      tradeItemState,
    ],
  );

  useEffect(() => {
    const sub = watch((value, { name, type }) => {
      const changedByUser = type != null;
      if (name === "percentage" && changedByUser) {
        const percentage = new Decimal(value.percentage).div(100);
        changeByPercentage(percentage);
      }
      if (name === "assetAmount" && changedByUser) {
        const assetAmount = value.assetAmount === "" ? "0" : value.assetAmount;
        const assetAmountDecimal = new Decimal(assetAmount);
        changeByAssetAmount(assetAmountDecimal);
      }
      if (name === "baseAmount" && changedByUser) {
        const baseAmount = value.baseAmount === "" ? "0" : value.baseAmount;
        const baseAmountDecimal = new Decimal(baseAmount);
        changeByBaseAmount(baseAmountDecimal);
      }
    });
    return () => sub.unsubscribe();
  }, [watch, maxBaseAmount.toString(), maxAssetAmount.toString()]);

  useEffect(() => {
    if (IOZtgAssetId.is(lastEditedAssetId)) {
      changeByBaseAmount(new Decimal(baseAmount));
    } else if (IOMarketOutcomeAssetId.is(lastEditedAssetId)) {
      changeByAssetAmount(new Decimal(assetAmount));
    } else {
      changeByPercentage(new Decimal(percentageDisplay).div(100));
    }
  }, [maxBaseAmount.toString(), maxAssetAmount.toString()]);

  return (
    <>
      {isSuccess === true ? (
        <TradeResult
          type={tradeItem.action}
          amount={new Decimal(finalAmounts.asset)}
          tokenName={tradeItemState?.asset.category.name}
          baseTokenAmount={new Decimal(finalAmounts.base)}
          baseToken={baseSymbol}
          marketId={tradeItemState?.market.marketId}
          marketQuestion={tradeItemState?.market.question}
        />
      ) : (
        <form
          className="bg-white rounded-[10px]"
          onSubmit={(e) => {
            e.preventDefault();
            swapTx();
          }}
        >
          <Tab.Group
            defaultIndex={0}
            onChange={(index: TradeTabType) => {
              setTabIndex(index);
              if (index === TradeTabType.Buy) {
                setTradeItem({
                  ...tradeItem,
                  action: "buy",
                });
              }
              if (index === TradeTabType.Sell) {
                setTradeItem({
                  ...tradeItem,
                  action: "sell",
                });
              }
              reset();
              setPercentageDisplay("0");
            }}
            selectedIndex={tabIndex}
          >
            <Tab.List className="flex justify-between h-[60px] sm:h-[71px] text-center rounded-[10px]">
              <Tab
                as={TradeTab}
                selected={type === "buy"}
                className="rounded-tl-[10px]"
              >
                Buy
              </Tab>
              <Tab
                as={TradeTab}
                selected={type === "sell"}
                className="rounded-tr-[10px]"
              >
                Sell
              </Tab>
            </Tab.List>
          </Tab.Group>
          <div className="flex flex-col p-[20px] sm:p-[30px]">
            <div className="center">
              <input
                type="number"
                {...register("assetAmount", {
                  required: true,
                  min: "0",
                  max: maxAssetAmount?.div(ZTG).toFixed(4),
                })}
                onFocus={() => {
                  setLastEditedAssetId(tradeItemState?.assetId);
                }}
                step="any"
                className="w-full bg-transparent outline-none !text-center text-[35px] sm:text-[58px]"
                autoFocus
              />
            </div>
            <div className="center sm:h-[48px] font-semibold capitalize text-[20px] sm:text-[28px]">
              {tradeItemState?.asset.category.name}
            </div>
            <div className="font-semibold text-center mb-[20px]">For</div>
            <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 mb-[20px] relative">
              <input
                type="number"
                {...register("baseAmount", {
                  required: true,
                  min: "0",
                  max: maxBaseAmount?.div(ZTG).toFixed(4),
                })}
                onFocus={() =>
                  setLastEditedAssetId(tradeItemState?.baseAssetId)
                }
                step="any"
                className="w-full bg-transparent outline-none !text-center"
              />
              <div className="mr-[10px] absolute right-0">{baseSymbol}</div>
            </div>
            <RangeInput
              min="0"
              max="100"
              value={percentageDisplay}
              onValueChange={setPercentageDisplay}
              onFocus={() => setLastEditedAssetId(tradeItemState?.assetId)}
              minLabel="0 %"
              step="0.1"
              valueSuffix="%"
              maxLabel="100 %"
              className="mb-[20px]"
              {...register("percentage")}
            />
            <div className="text-center mb-[20px]">
              <div className="text-ztg-12-150 sm:text-ztg-14-150">
                <div className="mb-[10px]">
                  <span className="text-sky-600">Average Price: </span>
                  {averagePrice} {baseSymbol}
                </div>
                <div className="mb-[10px]">
                  <span className="text-sky-600">Prediction After Trade: </span>
                  {predictionAfterTrade.toFixed(2)} {baseSymbol} (
                  {predictionAfterTrade.mul(100).toFixed(0)}%)
                </div>
                <div className="mb-[10px]">
                  <span className="text-sky-600">Price impact: </span>
                  {priceImpact}%
                </div>
              </div>
            </div>
            <TransactionButton
              disabled={!formState.isValid || isLoading === true}
              className="h-[56px]"
            >
              <div className="center font-normal h-[20px]">
                Confirm {`${capitalize(tradeItem.action)}`}
              </div>
              <div className="center font-normal text-ztg-12-120 h-[20px]">
                Trading fee: {fee} {baseSymbol}
              </div>
            </TransactionButton>
          </div>
        </form>
      )}
    </>
  );
});

export default TradeForm;
