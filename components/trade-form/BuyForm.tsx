import {
  isRpcSdk,
  MarketOutcomeAssetId,
  parseAssetId,
  ZTG,
} from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import {
  lookupAssetReserve,
  useAmm2Pool,
} from "lib/hooks/queries/amm2/useAmm2Pool";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import {
  approximateMaxAmountInForBuy,
  calculateSpotPrice,
  calculateSwapAmountOutForBuy,
  isValidBuyAmount,
} from "lib/util/amm2";
import { formatNumberCompact } from "lib/util/format-compact";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ISubmittableResult } from "@polkadot/types/types";
import { assetsAreEqual } from "lib/util/assets-are-equal";
import { perbillToNumber } from "lib/util/perbill-to-number";

const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;

const BuyForm = ({
  marketId,
  initialAsset,
  onSuccess,
}: {
  marketId: number;
  initialAsset?: MarketOutcomeAssetId;
  onSuccess: (
    data: ISubmittableResult,
    outcomeAsset: MarketOutcomeAssetId,
    amountIn: Decimal,
  ) => void;
}) => {
  const { data: constants } = useChainConstants();
  const {
    register,
    handleSubmit,
    getValues,
    formState,
    watch,
    setValue,
    trigger,
  } = useForm({
    reValidateMode: "onChange",
    mode: "onChange",
  });
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const { data: market } = useMarket({
    marketId,
  });
  const wallet = useWallet();
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;
  const { data: baseAssetBalance } = useBalance(wallet.realAddress, baseAsset);
  const { data: pool } = useAmm2Pool(marketId);

  const swapFee = pool?.swapFee.div(ZTG);
  const creatorFee = new Decimal(perbillToNumber(market?.creatorFee ?? 0));

  const outcomeAssets = market?.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );
  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | undefined
  >(initialAsset ?? outcomeAssets?.[0]);

  const formAmount = getValues("amount");

  const amountIn = new Decimal(
    formAmount && formAmount !== "" ? formAmount : 0,
  ).mul(ZTG);
  const assetReserve =
    pool?.reserves && lookupAssetReserve(pool?.reserves, selectedAsset);

  const validBuy = useMemo(() => {
    return (
      assetReserve &&
      pool.liquidity &&
      swapFee &&
      isValidBuyAmount(
        assetReserve,
        amountIn,
        pool.liquidity,
        swapFee,
        creatorFee,
      )
    );
  }, [assetReserve, pool?.liquidity, amountIn]);

  const maxAmountIn = useMemo(() => {
    return (
      assetReserve &&
      pool &&
      approximateMaxAmountInForBuy(assetReserve, pool.liquidity)
    );
  }, [assetReserve, pool?.liquidity]);

  const {
    amountOut,
    spotPrice,
    newSpotPrice,
    priceImpact,
    maxProfit,
    minAmountOut,
  } = useMemo(() => {
    const amountOut =
      assetReserve && pool.liquidity && swapFee
        ? calculateSwapAmountOutForBuy(
            assetReserve,
            amountIn,
            pool.liquidity,
            swapFee,
            creatorFee,
          )
        : new Decimal(0);

    const spotPrice =
      assetReserve && calculateSpotPrice(assetReserve, pool?.liquidity);

    const poolAmountOut = amountOut.minus(amountIn);
    const newSpotPrice =
      pool?.liquidity &&
      assetReserve &&
      calculateSpotPrice(assetReserve?.minus(poolAmountOut), pool?.liquidity);

    const priceImpact = spotPrice
      ? newSpotPrice?.div(spotPrice).minus(1).mul(100)
      : new Decimal(0);

    const maxProfit = amountOut.minus(amountIn);

    const minAmountOut = amountOut.mul(slippageMultiplier);

    return {
      amountOut,
      spotPrice,
      newSpotPrice,
      priceImpact,
      maxProfit,
      minAmountOut,
    };
  }, [amountIn, pool?.liquidity, assetReserve]);

  const { isLoading, send, fee } = useExtrinsic(
    () => {
      const amount = getValues("amount");
      if (
        !isRpcSdk(sdk) ||
        !amount ||
        amount === "" ||
        market?.categories?.length == null ||
        !selectedAsset
      ) {
        return;
      }

      return sdk.api.tx.neoSwaps.buy(
        marketId,
        market?.categories?.length,
        selectedAsset,
        new Decimal(amount).abs().mul(ZTG).toFixed(0),
        minAmountOut.toFixed(0),
      );
    },
    {
      onSuccess: (data) => {
        notificationStore.pushNotification(`Successfully traded`, {
          type: "Success",
        });
        onSuccess(data, selectedAsset!, amountIn);
      },
    },
  );

  const maxSpendableBalance = assetsAreEqual(baseAsset, fee?.assetId)
    ? baseAssetBalance?.minus(fee?.amount ?? 0)
    : baseAssetBalance;

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (
        !changedByUser ||
        !maxSpendableBalance ||
        maxSpendableBalance.eq(0) ||
        !maxAmountIn
      )
        return;

      if (name === "percentage") {
        const max = maxSpendableBalance.greaterThan(maxAmountIn)
          ? maxAmountIn
          : maxSpendableBalance;
        setValue(
          "amount",
          Number(
            max
              .mul(value.percentage)
              .abs()
              .div(100)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
          ),
        );
      } else if (name === "amount" && value.amount !== "") {
        setValue(
          "percentage",
          new Decimal(value.amount)
            .mul(ZTG)
            .div(maxSpendableBalance)
            .mul(100)
            .toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, maxSpendableBalance, maxAmountIn]);

  const onSubmit = () => {
    send();
  };
  return (
    <div className="flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col items-center gap-y-4"
      >
        <div className="flex w-full items-center justify-center rounded-md p-2">
          <div className="mr-4 font-mono">
            {amountOut.div(ZTG).abs().toFixed(3)}
          </div>
          <div>
            {market && selectedAsset && (
              <MarketContextActionOutcomeSelector
                market={market}
                selected={selectedAsset}
                options={outcomeAssets}
                onChange={(assetId) => {
                  setSelectedAsset(assetId);
                  trigger();
                }}
              />
            )}
          </div>
        </div>
        <div className="text-sm">For</div>
        <div className="center relative h-[56px] w-full rounded-md bg-anti-flash-white text-ztg-18-150 font-normal">
          <Input
            type="number"
            className="w-full bg-transparent font-mono outline-none"
            step="any"
            {...register("amount", {
              value: 0,
              required: {
                value: true,
                message: "Value is required",
              },
              validate: (value) => {
                if (value > (maxSpendableBalance?.div(ZTG).toNumber() ?? 0)) {
                  return `Insufficient balance (${maxSpendableBalance
                    ?.div(ZTG)
                    .toFixed(3)}${baseSymbol})`;
                } else if (value <= 0) {
                  return "Value cannot be zero or less";
                } else if (maxAmountIn?.div(ZTG)?.lessThanOrEqualTo(value)) {
                  return `Maximum amount of ${baseSymbol} that can be traded is ${maxAmountIn
                    .div(ZTG)
                    .toFixed(3)}`;
                } else if (validBuy?.isValid === false) {
                  return validBuy.message;
                }
              },
            })}
          />
          <div className="absolute right-0 mr-[10px]">{baseSymbol}</div>
        </div>
        <input
          className="mb-[10px] mt-[30px] w-full"
          type="range"
          disabled={
            !maxSpendableBalance || maxSpendableBalance.lessThanOrEqualTo(0)
          }
          {...register("percentage", { value: "0" })}
        />
        <div className="mb-[10px] flex w-full flex-col items-center gap-2 text-xs font-normal text-sky-600 ">
          <div className="h-[16px] text-xs text-vermilion">
            <>{formState.errors["amount"]?.message}</>
          </div>
          <div className="flex w-full justify-between">
            <div>Max profit:</div>
            <div className="text-black">
              {maxProfit.div(ZTG).toFixed(2)} {baseSymbol}
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div>Price after trade:</div>
            <div className="text-black">
              {newSpotPrice?.toFixed(2)} ({priceImpact?.toFixed(2)}%)
            </div>
          </div>
        </div>
        <FormTransactionButton
          className="w-full max-w-[250px]"
          disabled={formState.isValid === false || isLoading}
          disableFeeCheck={true}
        >
          <div>
            <div className="center h-[20px] font-normal">Buy</div>
            <div className="center h-[20px] text-ztg-12-120 font-normal">
              Network fee:{" "}
              {formatNumberCompact(fee?.amount.div(ZTG).toNumber() ?? 0)}{" "}
              {fee?.symbol}
            </div>
          </div>
        </FormTransactionButton>
      </form>
    </div>
  );
};

export default BuyForm;
