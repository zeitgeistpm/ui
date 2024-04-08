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
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import {
  approximateMaxAmountInForSell,
  calculateSpotPrice,
  calculateSwapAmountOutForSell,
  isValidSellAmount,
} from "lib/util/amm2";
import { formatNumberCompact } from "lib/util/format-compact";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ISubmittableResult } from "@polkadot/types/types";
import { perbillToNumber } from "lib/util/perbill-to-number";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";

const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;

const SellForm = ({
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
  const { data: pool } = useAmm2Pool(marketId);
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;

  const swapFee = pool?.swapFee.div(ZTG);
  const creatorFee = new Decimal(perbillToNumber(market?.creatorFee ?? 0));

  const outcomeAssets = market?.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );
  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | undefined
  >(initialAsset ?? outcomeAssets?.[0]);

  const { data: selectedAssetBalance } = useBalance(
    wallet.realAddress,
    selectedAsset,
  );
  const formAmount = getValues("amount");

  const amountIn = new Decimal(formAmount && formAmount !== "" ? formAmount : 0)
    .mul(ZTG)
    .abs();
  const assetReserve =
    pool?.reserves && lookupAssetReserve(pool?.reserves, selectedAsset);

  const validSell = useMemo(() => {
    return (
      assetReserve &&
      pool.liquidity &&
      swapFee &&
      isValidSellAmount(assetReserve, amountIn, pool.liquidity)
    );
  }, [assetReserve, pool?.liquidity, amountIn]);

  const maxAmountIn = useMemo(() => {
    return (
      assetReserve &&
      pool &&
      approximateMaxAmountInForSell(assetReserve, pool.liquidity)
    );
  }, [assetReserve, pool?.liquidity]);

  const { amountOut, newSpotPrice, priceImpact, minAmountOut } = useMemo(() => {
    const amountOut =
      assetReserve && pool.liquidity && swapFee
        ? calculateSwapAmountOutForSell(
            assetReserve,
            amountIn,
            pool.liquidity,
            swapFee,
            creatorFee,
          )
        : new Decimal(0);

    const spotPrice =
      assetReserve && calculateSpotPrice(assetReserve, pool?.liquidity);

    const poolAmountIn = amountIn.minus(amountOut);
    const newSpotPrice =
      pool?.liquidity &&
      assetReserve &&
      calculateSpotPrice(assetReserve?.plus(poolAmountIn), pool?.liquidity);

    const priceImpact = spotPrice
      ? newSpotPrice?.div(spotPrice).minus(1).mul(100)
      : new Decimal(0);

    const minAmountOut = amountOut.mul(slippageMultiplier);

    return {
      amountOut,
      spotPrice,
      newSpotPrice,
      priceImpact,
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
        market?.assets?.length == null ||
        !selectedAsset
      ) {
        return;
      }

      return sdk.api.tx.neoSwaps.sell(
        marketId,
        market?.assets?.length,
        selectedAsset,
        new Decimal(amount).mul(ZTG).toFixed(0),
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

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (
        !changedByUser ||
        !selectedAssetBalance ||
        selectedAssetBalance.eq(0) ||
        !maxAmountIn
      )
        return;

      if (name === "percentage") {
        const max = selectedAssetBalance.greaterThan(maxAmountIn)
          ? maxAmountIn
          : selectedAssetBalance;
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
            .div(selectedAssetBalance)
            .mul(100)
            .toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedAssetBalance, maxAmountIn]);

  const onSubmit = () => {
    send();
  };
  return (
    <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col items-center gap-y-4"
      >
        <div className="flex w-full items-center justify-center rounded-md bg-anti-flash-white pr-2 font-mono">
          <Input
            type="number"
            className="w-full bg-transparent outline-none"
            step="any"
            {...register("amount", {
              value: 0,
              required: {
                value: true,
                message: "Value is required",
              },
              validate: (value) => {
                if (value > (selectedAssetBalance?.div(ZTG).toNumber() ?? 0)) {
                  return `Insufficient balance. Current balance: ${selectedAssetBalance
                    ?.div(ZTG)
                    .toFixed(3)}`;
                } else if (value <= 0) {
                  return "Value cannot be zero or less";
                } else if (maxAmountIn?.div(ZTG)?.lessThanOrEqualTo(value)) {
                  return `Maximum amount that can be traded is ${maxAmountIn
                    .div(ZTG)
                    .toFixed(3)}`;
                } else if (validSell?.isValid === false) {
                  return validSell.message;
                }
              },
            })}
          />
          <div>
            {market && selectedAsset && (
              <MarketContextActionOutcomeSelector
                market={market}
                selected={selectedAsset}
                options={outcomeAssets}
                onChange={(assetId) => {
                  setSelectedAsset(assetId);
                }}
              />
            )}
          </div>
        </div>
        <div className="text-sm">For</div>
        <div className="flex w-full items-center justify-center font-mono">
          <div className="mr-4">{amountOut.div(ZTG).abs().toFixed(3)}</div>
          <div className="mr-[10px]">{baseSymbol}</div>
        </div>
        <input
          className="mb-[10px] mt-[30px] w-full"
          type="range"
          disabled={
            !selectedAssetBalance || selectedAssetBalance.lessThanOrEqualTo(0)
          }
          {...register("percentage", { value: "0" })}
        />
        <div className="mb-[10px] flex w-full flex-col items-center gap-2 text-xs font-normal text-sky-600">
          <div className="h-[16px] text-xs text-vermilion">
            <>{formState.errors["amount"]?.message}</>
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
            <div className="center h-[20px] font-normal">Sell</div>
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

export default SellForm;
