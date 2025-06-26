import { ISubmittableResult } from "@polkadot/types/types";
import { OrderStatus } from "@zeitgeistpm/indexer";
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
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
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
  calculateSpotPriceAfterBuy,
  calculateSwapAmountOutForBuy,
  isValidBuyAmount,
} from "lib/util/amm2";
import { assetsAreEqual } from "lib/util/assets-are-equal";
import { formatNumberCompact } from "lib/util/format-compact";
import { selectOrdersForMarketBuy } from "lib/util/order-selection";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { perbillToNumber } from "lib/util/perbill-to-number";
import { max } from "moment";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { CombinatorialToken } from "lib/types/combinatorial";

const BuyForm = ({
  marketId,
  poolData,
  initialAsset,
  onSuccess,
}: {
  marketId: number;
  poolData?: any;
  initialAsset?: MarketOutcomeAssetId;
  onSuccess: (
    data: ISubmittableResult,
    outcomeAsset: MarketOutcomeAssetId | CombinatorialToken,
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
  // Only fetch market data if poolData is not provided
  const { data: market } = useMarket(poolData ? undefined : { marketId });

  const wallet = useWallet();
  const baseAsset = poolData 
    ? parseAssetIdString('ZTG') 
    : parseAssetIdString(market?.baseAsset);
  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;
  const { data: baseAssetBalance } = useBalance(wallet.realAddress, baseAsset);
  
  //TODO: fix this so it's consistent among: combo markets, legacy, and new markets
  const poolId = poolData?.poolId || (isCombinatorialToken(market?.outcomeAssets[0]) ? market?.neoPool?.poolId : undefined);

  const { data: pool } = useAmm2Pool(poolData?.poolId ? 0 : marketId, poolId);
  const [sellAssets, setSellAssets] = useState<CombinatorialToken[]>([]);  

  const { data: orders } = useOrders({
    marketId_eq: marketId,
    status_eq: OrderStatus.Placed,
  });

  const swapFee = poolData 
    ? new Decimal(poolData.swapFee || 0).div(ZTG)
    : pool?.swapFee.div(ZTG);
  const creatorFee = poolData 
    ? new Decimal(0) // set creator fees to 0 for combo markets
    : new Decimal(perbillToNumber(market?.creatorFee ?? 0));

  const outcomeAssets = poolData 
    ? poolData.outcomeCombinations.map((combo: any) => combo.assetId)
    : pool?.assetIds.map(
        (assetIdString) =>
          isCombinatorialToken(assetIdString) ? assetIdString : parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
      );

  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | CombinatorialToken | undefined
  >(initialAsset);

  useEffect(() => {
    if (isCombinatorialToken(selectedAsset)) {
      const getAllOtherAssets = (selectedAsset: CombinatorialToken) => {
        const allAssets = poolData?.outcomeCombinations.map((combo: any) => combo.assetId) || pool?.assetIds || [];
        return allAssets.filter(assetId => 
          isCombinatorialToken(assetId) && JSON.stringify(assetId) !== JSON.stringify(selectedAsset)
        );
      }
      setSellAssets(getAllOtherAssets(selectedAsset));
    }
  }, [selectedAsset, pool?.assetIds, poolData?.outcomeCombinations]);
  
  useEffect(() => {
    if (!selectedAsset && outcomeAssets?.[0]) {
      setSelectedAsset(outcomeAssets[0]);
    }
  }, [outcomeAssets, selectedAsset]);

  const formAmount = getValues("amount");

  const amountIn = new Decimal(
    formAmount && formAmount !== "" ? formAmount : 0,
  ).mul(ZTG);

  const assetReserve = poolData?.reserves 
    ? lookupAssetReserve(poolData.reserves, selectedAsset)
    : pool?.reserves && lookupAssetReserve(pool?.reserves, selectedAsset);

  const effectiveLiquidity = poolData 
    ? new Decimal(poolData.liquidity)
    : pool?.liquidity;

  const validBuy = useMemo(() => {
    return (
      assetReserve &&
      effectiveLiquidity &&
      swapFee &&
      isValidBuyAmount(
        assetReserve,
        amountIn,
        effectiveLiquidity,
        swapFee,
        creatorFee,
      )
    );
  }, [assetReserve, effectiveLiquidity, amountIn]);

  const maxAmountIn = useMemo(() => {
    return (
      assetReserve &&
      effectiveLiquidity &&
      approximateMaxAmountInForBuy(assetReserve, effectiveLiquidity)
    );
  }, [assetReserve, effectiveLiquidity]);
  
  const { amountOut, spotPrice, newSpotPrice, priceImpact, maxProfit } =
    useMemo(() => {
      const amountOut =
        assetReserve && effectiveLiquidity && swapFee
          ? calculateSwapAmountOutForBuy(
              assetReserve,
              amountIn,
              effectiveLiquidity,
              swapFee,
              creatorFee,
            )
          : new Decimal(0);

      const spotPrice =
        assetReserve && effectiveLiquidity && calculateSpotPrice(assetReserve, effectiveLiquidity);

      const newSpotPrice =
        effectiveLiquidity &&
        assetReserve &&
        swapFee &&
        calculateSpotPriceAfterBuy(
          assetReserve,
          effectiveLiquidity,
          amountOut,
          amountIn,
          swapFee,
          creatorFee,
        );

      const priceImpact = spotPrice
        ? newSpotPrice?.div(spotPrice).minus(1).mul(100)
        : new Decimal(0);

      const maxProfit = amountOut.minus(amountIn);

      return {
        amountOut,
        spotPrice,
        newSpotPrice,
        priceImpact,
        maxProfit,
      };
    }, [amountIn, effectiveLiquidity, assetReserve]);

  const { isLoading, send, fee } = useExtrinsic(
    () => {
      const amount = getValues("amount");
      const effectivePoolId = poolData?.poolId || pool?.poolId;
      const assetCount = poolData ? poolData?.outcomeCombinations.length : pool?.assetIds.length;

      if (
        !isRpcSdk(sdk) ||
        !effectivePoolId ||
        !amount ||
        amount === "" ||
        assetCount == null ||
        !selectedAsset ||
        !newSpotPrice ||
        !orders ||
        (isCombinatorialToken(selectedAsset) && sellAssets.length === 0)
      ) {
        return;
      }
      const amountDecimal = new Decimal(amount).mul(ZTG); // base asset amount

      const maxPrice = newSpotPrice.plus(DEFAULT_SLIPPAGE_PERCENTAGE / 100); // adjust by slippage
      const approxOutcomeAmount = amountDecimal.mul(maxPrice); // this will be slightly higher than the expect amount out and therefore may pick up extra order suggestions

      const selectedOrders = selectOrdersForMarketBuy(
        maxPrice,
        orders
          .filter(({ filledPercentage }) => filledPercentage !== 100)
          .map(({ id, side, price, outcomeAmount }) => ({
            id: Number(id),
            amount: outcomeAmount,
            price,
            side,
          })),
        approxOutcomeAmount.abs().mul(ZTG),
      );

      if (!isCombinatorialToken(selectedAsset)) {
        return sdk.api.tx.neoSwaps.buy(
          effectivePoolId,
          assetCount,
          selectedAsset,
          new Decimal(amount).mul(ZTG).toFixed(0),
          maxPrice.mul(ZTG).toFixed(0),
          // selectedOrders.map(({ id }) => id),
          // "ImmediateOrCancel",
        );
      } else if(isCombinatorialToken(selectedAsset)) {
        return sdk.api.tx.neoSwaps.comboBuy(
          effectivePoolId,
          assetCount,
          [selectedAsset],
          sellAssets,
          amountDecimal.toFixed(0),
          maxPrice.mul(ZTG).toFixed(0),
          // selectedOrders.map(({ id }) => id),
          // "ImmediateOrCancel",
        );
      }
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
  console.log(outcomeAssets)
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
            {(market || poolData) && selectedAsset && (
              <MarketContextActionOutcomeSelector
                market={poolData ? ({} as any) : market!}
                selected={selectedAsset}
                options={poolData ? poolData.outcomeCombinations.map((combo: any) => combo.assetId) : outcomeAssets}
                outcomeCombinations={poolData?.outcomeCombinations}
                onChange={(assetId) => {
                  setSelectedAsset(assetId);
                  trigger();
                }}
              />
            )}
          </div>
        </div>
        <div className="text-sm">For</div>
        <div className="center relative h-[56px] w-full rounded-md bg-white text-ztg-18-150 font-normal">
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
            {formState.errors["amount"]?.message?.toString()}
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
          loading={isLoading}
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
