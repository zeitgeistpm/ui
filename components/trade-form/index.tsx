import { Tab } from "@headlessui/react";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  AssetId,
  IOForeignAssetId,
  IOMarketOutcomeAssetId,
  IOZtgAssetId,
  MarketOutcomeAssetId,
  ZTG,
  getMarketIdOf,
} from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TradeResult from "components/markets/TradeResult";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { positionsRootKey } from "lib/hooks/queries/useAccountTokenPositions";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useTradeItemState } from "lib/hooks/queries/useTradeItemState";
import {
  TradeItem,
  useTradeItem,
  useTradeMaxAssetAmount,
  useTradeMaxBaseAmount,
  useTradeTransaction,
} from "lib/hooks/trade";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { calcInGivenOut, calcOutGivenIn, calcSpotPrice } from "lib/math";
import { useWallet } from "lib/state/wallet";
import { TradeType } from "lib/types";
import { awaitIndexer } from "lib/util/await-indexer";
import { formatNumberCompact } from "lib/util/format-compact";
import { capitalize } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import RangeInput from "../ui/RangeInput";
import TransactionButton from "../ui/TransactionButton";
import TradeTab, { TradeTabType } from "./TradeTab";
import { useMarket } from "lib/hooks/queries/useMarket";
import { perbillToNumber } from "lib/util/perbill-to-number";

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

const TradeForm = ({
  outcomeAssets,
}: {
  outcomeAssets?: MarketOutcomeAssetId[];
}) => {
  const { data: tradeItem, set: setTradeItem } = useTradeItem();

  if (!tradeItem) {
    return <div></div>;
  }

  return (
    <Inner
      outcomeAssets={outcomeAssets}
      tradeItem={tradeItem}
      setTradeItem={setTradeItem}
    />
  );
};

export default TradeForm;

const Inner = ({
  tradeItem,
  setTradeItem,
  outcomeAssets,
}: {
  tradeItem: TradeItem;
  setTradeItem: (trade: TradeItem) => void;
  outcomeAssets?: MarketOutcomeAssetId[];
}) => {
  const queryClient = useQueryClient();
  const [sdk, id] = useSdkv2();

  const { register, formState, watch, setValue, reset } = useForm<{
    percentage: string;
    assetAmount: string;
    baseAmount: string;
  }>({
    defaultValues: { percentage: "0", assetAmount: "0", baseAmount: "0" },
  });

  const wallet = useWallet();
  const signer = wallet.activeAccount;

  const { data: tradeItemState } = useTradeItemState(tradeItem);

  const { data: market } = useMarket({
    marketId: getMarketIdOf(tradeItem.assetId),
  });

  const {
    poolBaseBalance,
    baseWeight,
    assetWeight,
    poolAssetBalance,
    swapFee,
  } = tradeItemState ?? {};

  const [tabIndex, setTabIndex] = useState<number>(
    tradeItem.action === "buy" ? TradeTabType.Buy : TradeTabType.Sell,
  );

  const maxBaseAmount = useTradeMaxBaseAmount(tradeItem);
  const maxAssetAmount = useTradeMaxAssetAmount(tradeItem);

  const maxBaseAmountDecimal = new Decimal(maxBaseAmount ?? 0).div(ZTG);
  const maxAssetAmountDecimal = new Decimal(maxAssetAmount ?? 0).div(ZTG);

  const [percentageDisplay, setPercentageDisplay] = useState<string>("0");
  const { data: assetMetadata } = useAssetMetadata(tradeItemState?.baseAssetId);
  const baseSymbol = assetMetadata?.symbol;

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
          0,
        );
      } else {
        return calcSpotPrice(
          tradeItemState.poolBaseBalance.sub(new Decimal(baseAmount).mul(ZTG)),
          tradeItemState.baseWeight,
          tradeItemState.poolAssetBalance.add(
            new Decimal(assetAmount).mul(ZTG),
          ),
          tradeItemState.assetWeight,
          0,
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
    fee,
    isBroadcasting,
    resetState: resetTransactionState,
  } = useExtrinsic(() => transaction, {
    onSuccess: (data) => {
      const { baseAmount, assetAmount } = getTradeValuesFromExtrinsicResult(
        type,
        data,
      );

      // notifications.pushNotification(
      //   `Successfully ${
      //     tradeItem.action === "buy" ? "bought" : "sold"
      //   } ${assetAmount} ${
      //     tradeItemState?.asset?.name
      //   } for ${baseAmount} ${baseSymbol}`,
      //   { type: "Success", lifetime: 60 },
      // );

      setFinalAmounts({ asset: assetAmount, base: baseAmount });
      setPercentageDisplay("0");

      // Immediately invalidate spot prices and AMM pool data to show updated state
      queryClient.invalidateQueries({
        queryKey: [id, "market-spot-prices", market?.marketId],
      });
      queryClient.invalidateQueries({
        queryKey: [id, "amm2-pool", market?.marketId],
      });
      
      // Wait for indexer to process the trade before invalidating positions
      awaitIndexer(() => {
        if (wallet.realAddress) {
          queryClient.invalidateQueries({
            queryKey: [id, positionsRootKey, wallet.realAddress],
          });
        }
      });
    },
  });

  const changeByPercentage = useCallback(
    (percentage: Decimal) => {
      const [balanceIn, weightIn, balanceOut, weightOut] = [
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
      ];

      if (
        tradeItemState == null ||
        balanceIn == null ||
        weightIn == null ||
        balanceOut == null ||
        weightOut == null
      ) {
        return;
      }

      if (tradeItem.action === "buy" && balanceIn) {
        const amountOut = maxAssetAmountDecimal.mul(percentage);

        const amountIn = calcInGivenOut(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          amountOut.mul(ZTG),
          tradeItemState.swapFee,
          perbillToNumber(market?.creatorFee ?? 0),
        );

        setValue(
          "baseAmount",
          amountIn.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setValue("assetAmount", amountOut.toFixed(4, Decimal.ROUND_DOWN));
      } else if (tradeItem.action === "sell") {
        const amountOut = maxBaseAmountDecimal.mul(percentage);

        const amountIn = calcInGivenOut(
          balanceOut,
          weightOut,
          balanceIn,
          weightIn,
          amountOut.mul(ZTG),
          tradeItemState.swapFee,
          perbillToNumber(market?.creatorFee ?? 0),
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
      const [balanceIn, weightIn, balanceOut, weightOut] = [
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
      ];
      if (
        tradeItemState == null ||
        balanceIn == null ||
        weightIn == null ||
        balanceOut == null ||
        weightOut == null ||
        swapFee == null
      ) {
        return;
      }

      const percentage = maxAssetAmountDecimal.gt(0)
        ? assetAmount.div(maxAssetAmountDecimal).mul(100).toDecimalPlaces(0)
        : new Decimal(0);

      if (tradeItem.action === "buy") {
        const amountIn = calcInGivenOut(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          assetAmount.mul(ZTG),
          swapFee,
          perbillToNumber(market?.creatorFee ?? 0),
        );

        setValue(
          "baseAmount",
          amountIn.div(ZTG).toFixed(4, Decimal.ROUND_DOWN),
        );
        setPercentageDisplay(percentage.toString());
      } else if (tradeItem.action === "sell") {
        const amountOut = calcOutGivenIn(
          balanceIn,
          weightIn,
          balanceOut,
          weightOut,
          assetAmount.mul(ZTG),
          swapFee,
          perbillToNumber(market?.creatorFee ?? 0),
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
          perbillToNumber(market?.creatorFee ?? 0),
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
          perbillToNumber(market?.creatorFee ?? 0),
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
        const percentage = new Decimal(value.percentage ?? 0).div(100);
        changeByPercentage(percentage);
      }
      if (name === "assetAmount" && changedByUser) {
        const assetAmount = value.assetAmount === "" ? "0" : value.assetAmount;
        const assetAmountDecimal = new Decimal(assetAmount ?? 0);
        changeByAssetAmount(assetAmountDecimal);
      }
      if (name === "baseAmount" && changedByUser) {
        const baseAmount = value.baseAmount === "" ? "0" : value.baseAmount;
        const baseAmountDecimal = new Decimal(baseAmount ?? 0);
        changeByBaseAmount(baseAmountDecimal);
      }
    });
    return () => sub.unsubscribe();
  }, [watch, maxBaseAmount.toString(), maxAssetAmount.toString()]);

  useEffect(() => {
    if (
      IOZtgAssetId.is(lastEditedAssetId) ||
      IOForeignAssetId.is(lastEditedAssetId)
    ) {
      changeByBaseAmount(new Decimal(baseAmount));
    } else if (IOMarketOutcomeAssetId.is(lastEditedAssetId)) {
      changeByAssetAmount(new Decimal(assetAmount));
    } else {
      changeByPercentage(new Decimal(percentageDisplay).div(100));
    }
  }, [maxBaseAmount.toString(), maxAssetAmount.toString()]);

  return (
    <div>
      {isSuccess === true && tradeItemState ? (
        <TradeResult
          type={tradeItem.action}
          amount={new Decimal(finalAmounts.asset)}
          tokenName={tradeItemState.asset?.name ?? undefined}
          baseTokenAmount={new Decimal(finalAmounts.base)}
          baseToken={baseSymbol}
          marketId={tradeItemState?.market.marketId}
          marketQuestion={tradeItemState?.market.question ?? undefined}
          onContinueClick={() => {
            setPercentageDisplay("0");
            reset();
            resetTransactionState();
          }}
        />
      ) : (
        <form
          className="relative rounded-[10px] bg-white"
          onSubmit={(e) => {
            e.preventDefault();
            swapTx();
          }}
        >
          <div className="hidden md:block">
            <Tab.Group
              defaultIndex={tabIndex}
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
              <Tab.List className="flex h-[60px] justify-between rounded-xl text-center sm:h-[71px]">
                <Tab
                  as={TradeTab}
                  selected={type === "buy"}
                  className="rounded-tl-xl"
                >
                  Buy
                </Tab>
                <Tab
                  as={TradeTab}
                  selected={type === "sell"}
                  className="rounded-tr-xl"
                >
                  Sell
                </Tab>
              </Tab.List>
            </Tab.Group>
          </div>
          <div className="flex flex-col p-[20px] sm:p-[30px]">
            <div className="center relative">
              <Input
                type="number"
                {...register("assetAmount", {
                  required: true,
                  min: "0",
                  max: maxAssetAmount?.div(ZTG).toFixed(4),
                  validate: (value) => Number(value) > 0,
                })}
                onFocus={() => {
                  if (tradeItemState?.assetId) {
                    setLastEditedAssetId(tradeItemState?.assetId);
                  }
                }}
                step="any"
                className="w-full bg-transparent text-center text-6xl sm:text-4xl lg:text-5xl"
                autoFocus
              />
            </div>
            <div className="center mb-4 font-semibold">
              {market && tradeItemState?.assetId && (
                <MarketContextActionOutcomeSelector
                  market={market}
                  selected={tradeItemState?.assetId}
                  options={outcomeAssets}
                  onChange={(assetId) => {
                    reset();
                    setTradeItem({
                      action: tradeItem.action,
                      assetId,
                    });
                  }}
                />
              )}
            </div>
            <div className="center relative mb-[20px] h-[56px] rounded-lg bg-anti-flash-white text-ztg-18-150">
              <Input
                type="number"
                {...register("baseAmount", {
                  required: true,
                  min: "0",
                  max: maxBaseAmount?.div(ZTG).toFixed(4),
                  validate: (value) => Number(value) > 0,
                })}
                onFocus={() => {
                  if (tradeItemState?.baseAssetId) {
                    setLastEditedAssetId(tradeItemState?.baseAssetId);
                  }
                }}
                step="any"
                className="w-full bg-transparent text-center"
              />
              <div className="absolute right-2 mr-[10px]">{baseSymbol}</div>
            </div>
            <RangeInput
              min="0"
              max="100"
              value={percentageDisplay}
              onValueChange={setPercentageDisplay}
              onFocus={() => {
                if (tradeItemState?.assetId) {
                  setLastEditedAssetId(tradeItemState?.assetId);
                }
              }}
              minLabel="0 %"
              step="0.1"
              valueSuffix="%"
              maxLabel="100 %"
              className="mb-[20px]"
              disabled={isLoading === true || signer == null}
              {...register("percentage")}
            />
            <div className="mb-4 text-center">
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

            <div className="relative">
              <TransactionButton
                disabled={!formState.isValid || isLoading === true}
                className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
                type="submit"
                extrinsic={transaction}
                loading={isBroadcasting}
              >
                <div>
                  <div className="center h-[20px] font-normal">
                    Confirm {`${capitalize(tradeItem?.action)}`}
                  </div>
                  <div className="center h-[20px] text-ztg-12-120 font-normal">
                    Transaction fee:{" "}
                    {formatNumberCompact(fee?.amount.div(ZTG).toNumber() ?? 0)}{" "}
                    {fee?.symbol}
                  </div>
                </div>
              </TransactionButton>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
