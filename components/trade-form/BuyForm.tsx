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
import GlassSlider from "components/ui/GlassSlider";
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
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { sortAssetsByMarketOrder } from "lib/util/sort-assets-by-market";
import { CombinatorialToken } from "lib/types/combinatorial";

const BuyForm = ({
  marketId,
  poolData,
  initialAsset,
  onSuccess,
  filteredAssets,
  outcomeCombinations,
}: {
  marketId: number;
  poolData?: any;
  initialAsset?: MarketOutcomeAssetId | CombinatorialToken;
  onSuccess: (
    data: ISubmittableResult,
    outcomeAsset: MarketOutcomeAssetId | CombinatorialToken,
    amountIn: Decimal,
  ) => void;
  filteredAssets?: (MarketOutcomeAssetId | CombinatorialToken)[];
  outcomeCombinations?: Array<{
    assetId: CombinatorialToken;
    name: string;
    color: string;
  }>;
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
    reset,
  } = useForm({
    reValidateMode: "onChange",
    mode: "onChange",
    defaultValues: {
      amount: 0,
      percentage: "0",
    },
  });

  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const percentageValue = watch("percentage");
  const isUpdatingRef = useRef(false);
  // Only fetch market data if poolData is not provided
  const { data: market } = useMarket(poolData ? undefined : { marketId });

  const wallet = useWallet();
  const baseAsset = poolData
    ? parseAssetIdString("ZTG")
    : parseAssetIdString(market?.baseAsset);
  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;
  const { data: baseAssetBalance } = useBalance(wallet.realAddress, baseAsset);
  //TODO: fix this so it's consistent among: combo markets, legacy, and new markets
  const firstAssetString = market?.outcomeAssets[0];
  let parsedFirstAsset;
  let isFirstCombi = false;

  try {
    // Try to parse as JSON first (for combinatorial tokens)
    parsedFirstAsset = JSON.parse(firstAssetString || "{}");
    isFirstCombi = isCombinatorialToken(parsedFirstAsset);
  } catch {
    // Fall back to parseAssetIdString for regular assets
    parsedFirstAsset = parseAssetIdString(firstAssetString);
    isFirstCombi = isCombinatorialToken(parsedFirstAsset);
  }

  const poolId =
    poolData?.poolId || (isFirstCombi ? market?.neoPool?.poolId : undefined);

  const useAmm2PoolMarketId = poolData?.poolId ? 0 : marketId;
  const useAmm2PoolPoolId = poolId ?? null;

  const { data: pool } = useAmm2Pool(useAmm2PoolMarketId, useAmm2PoolPoolId);

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
  // Sort assets to match the order in market.outcomeAssets

  const outcomeAssets = (() => {
    if (filteredAssets) {
      return sortAssetsByMarketOrder(filteredAssets, market?.outcomeAssets);
    }

    if (poolData?.assetIds) {
      return sortAssetsByMarketOrder(poolData.assetIds, market?.outcomeAssets);
    }

    if (pool?.assetIds) {
      const assets = pool.assetIds.map((assetIdString) =>
        isCombinatorialToken(assetIdString)
          ? assetIdString
          : (parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId),
      );
      return sortAssetsByMarketOrder(assets, market?.outcomeAssets);
    }

    return undefined;
  })();

  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | CombinatorialToken | undefined
  >(initialAsset);

  const { data: selectedAssetBalance } = useBalance(
    wallet.realAddress,
    selectedAsset,
  );

  useEffect(() => {
    if (isCombinatorialToken(selectedAsset)) {
      const getAllOtherAssets = (selectedAsset: CombinatorialToken) => {
        const allAssets = poolData?.assetIds || pool?.assetIds || [];
        return allAssets.filter(
          (assetId) =>
            isCombinatorialToken(assetId) &&
            JSON.stringify(assetId) !== JSON.stringify(selectedAsset),
        );
      };
      setSellAssets(getAllOtherAssets(selectedAsset));
    }
  }, [selectedAsset, pool?.assetIds, poolData?.assetIds]);

  useEffect(() => {
    if (!selectedAsset && outcomeAssets?.[0]) {
      setSelectedAsset(outcomeAssets[0]);
    }
  }, [outcomeAssets, selectedAsset]);

  const formAmount = watch("amount");

  const amountIn = new Decimal(
    formAmount && formAmount !== 0 ? formAmount : 0,
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
        assetReserve &&
        effectiveLiquidity &&
        calculateSpotPrice(assetReserve, effectiveLiquidity);

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
      const assetCount = poolData?.assetIds?.length || pool?.assetIds?.length;

      if (
        !isRpcSdk(sdk) ||
        !effectivePoolId ||
        !amount ||
        amount === 0 ||
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
      } else if (isCombinatorialToken(selectedAsset)) {
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
          lifetime: 5,
        });
        reset();
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
        isUpdatingRef.current ||
        !maxSpendableBalance ||
        maxSpendableBalance.eq(0) ||
        !maxAmountIn
      )
        return;

      isUpdatingRef.current = true;

      try {
        if (name === "percentage" && value.percentage != null) {
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
        } else if (
          name === "amount" &&
          value.amount != null &&
          value.amount !== 0
        ) {
          const max = maxSpendableBalance.greaterThan(maxAmountIn)
            ? maxAmountIn
            : maxSpendableBalance;
          setValue(
            "percentage",
            new Decimal(value.amount)
              .mul(ZTG)
              .div(max)
              .mul(100)
              .toString(),
          );
        }
        trigger("amount");
      } finally {
        isUpdatingRef.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, maxSpendableBalance, maxAmountIn]);

  const onSubmit = () => {
    send();
  };

  return (
    <div className="flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold text-white">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col items-center gap-y-4"
      >
        <div className="flex w-full items-center gap-4">
          {(market || poolData) && selectedAsset && (
            <div className="flex-1">
              <MarketContextActionOutcomeSelector
                market={market ?? undefined}
                selected={selectedAsset}
                options={outcomeAssets}
                outcomeCombinations={outcomeCombinations}
                onChange={(assetId) => {
                  setSelectedAsset(assetId);
                  trigger();
                }}
              />
            </div>
          )}
          <div className="flex h-[56px] flex-1 items-center justify-center rounded-lg bg-white/10 px-4 text-xl font-bold text-white shadow-md backdrop-blur-sm">
            {amountOut.div(ZTG).abs().toFixed(3)}
          </div>
        </div>
        <div className="relative w-full">
          <Input
            type="number"
            className="h-[56px] w-full rounded-lg bg-white/10 px-4 text-center text-xl font-bold text-white shadow-md placeholder:text-white/50 focus:bg-white/15"
            step="any"
            {...register("amount", {
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
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-white/90">
            {baseSymbol}
          </div>
        </div>
        <GlassSlider
          className="mb-[10px] mt-[30px] w-full"
          min="0"
          max="100"
          step="1"
          value={percentageValue}
          disabled={
            !maxSpendableBalance || maxSpendableBalance.lessThanOrEqualTo(0)
          }
          {...register("percentage")}
        />
        <div className="mb-4 flex w-full flex-col items-center gap-3 rounded-lg bg-white/5 p-4 text-sm font-medium">
          <div className="h-4 text-xs font-semibold text-ztg-red-400">
            {formState.errors["amount"]?.message?.toString()}
          </div>
          <div className="flex w-full justify-between">
            <div className="text-white/80">Max profit:</div>
            <div className="font-semibold text-white">
              {maxProfit.div(ZTG).toFixed(2)} {baseSymbol}
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div className="text-white/80">Price after trade:</div>
            <div className="font-semibold text-white">
              {newSpotPrice?.toFixed(2)} ({priceImpact?.toFixed(2)}%)
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div className="text-white/80">Current shares:</div>
            <div className="font-semibold text-white">
              {selectedAssetBalance?.div(ZTG).toFixed(3, Decimal.ROUND_DOWN) ??
                "0.000"}
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
