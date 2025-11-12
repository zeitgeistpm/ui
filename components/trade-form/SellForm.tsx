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
  approximateMaxAmountInForSell,
  calculateSpotPrice,
  calculateSwapAmountOutForSell,
  isValidSellAmount,
} from "lib/util/amm2";
import { formatNumberCompact } from "lib/util/format-compact";
import { selectOrdersForMarketSell } from "lib/util/order-selection";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { perbillToNumber } from "lib/util/perbill-to-number";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  isCombinatorialToken,
  isEqualCombinatorialToken,
  CombinatorialToken,
} from "lib/types/combinatorial";
import { sortAssetsByMarketOrder } from "lib/util/sort-assets-by-market";

const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;

const SellForm = ({
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
  const percentageValue = watch("percentage");
  const isUpdatingRef = useRef(false);
  const notificationStore = useNotifications();
  // Always fetch market data for categories, even if poolData exists
  const { data: market } = useMarket({ marketId });
  const wallet = useWallet();
  const poolId = poolData?.poolId || market?.neoPool?.poolId;
  const { data: pool } = useAmm2Pool(marketId, poolId);
  const baseAsset = poolData
    ? parseAssetIdString("ZTG")
    : parseAssetIdString(market?.baseAsset);
  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;
  const { data: orders } = useOrders({
    marketId_eq: marketId,
    status_eq: OrderStatus.Placed,
  });

  const swapFee = poolData
    ? new Decimal(poolData.swapFee || 0).div(ZTG)
    : pool?.swapFee.div(ZTG);
  const creatorFee = poolData
    ? new Decimal(0) // Combo markets don't have creator fees
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
  >(initialAsset ?? outcomeAssets?.[0]);

  const { data: selectedAssetBalance } = useBalance(
    wallet.realAddress,
    selectedAsset,
  );

  const formAmount = watch("amount");

  const amountIn = new Decimal(formAmount && formAmount !== 0 ? formAmount : 0)
    .mul(ZTG)
    .abs();
  const assetReserve = poolData?.reserves
    ? lookupAssetReserve(poolData.reserves, selectedAsset)
    : pool?.reserves && lookupAssetReserve(pool?.reserves, selectedAsset);

  const effectiveLiquidity = poolData
    ? new Decimal(poolData.liquidity)
    : pool?.liquidity;

  const validSell = useMemo(() => {
    return (
      assetReserve &&
      effectiveLiquidity &&
      swapFee &&
      isValidSellAmount(assetReserve, amountIn, effectiveLiquidity)
    );
  }, [assetReserve, effectiveLiquidity, amountIn]);

  const maxAmountIn = useMemo(() => {
    return (
      assetReserve &&
      effectiveLiquidity &&
      approximateMaxAmountInForSell(assetReserve, effectiveLiquidity)
    );
  }, [assetReserve, effectiveLiquidity]);

  const { amountOut, newSpotPrice, priceImpact, minAmountOut } = useMemo(() => {
    const amountOut =
      assetReserve && effectiveLiquidity && swapFee
        ? calculateSwapAmountOutForSell(
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

    const poolAmountIn = amountIn.minus(amountOut);
    const newSpotPrice =
      effectiveLiquidity &&
      assetReserve &&
      calculateSpotPrice(assetReserve?.plus(poolAmountIn), effectiveLiquidity);

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
  }, [amountIn, effectiveLiquidity, assetReserve]);

  const { isLoading, send, fee } = useExtrinsic(
    () => {
      const amount = getValues("amount");
      const effectivePoolId = poolData?.poolId || pool?.poolId;

      const categoryCount =
        poolData?.assetIds?.length || poolData?.outcomeCombinations?.length || market?.categories?.length;

      if (
        !isRpcSdk(sdk) ||
        !effectivePoolId ||
        !amount ||
        amount === 0 ||
        categoryCount == null ||
        !selectedAsset ||
        (isCombinatorialToken(selectedAsset) &&
          (poolData?.assetIds?.length || poolData?.outcomeCombinations?.length || 0) <= 1) ||
        !newSpotPrice ||
        !orders
      ) {
        return;
      }
      const minPrice = newSpotPrice.mul(slippageMultiplier); // adjust by slippage

      const selectedOrders = selectOrdersForMarketSell(
        minPrice,
        orders
          .filter(({ filledPercentage }) => filledPercentage !== 100)
          .map(({ id, side, price, outcomeAmount }) => ({
            id: Number(id),
            amount: outcomeAmount,
            price,
            side,
          })),
        new Decimal(amount).abs().mul(ZTG),
      );

      if (!isCombinatorialToken(selectedAsset)) {
        return sdk.api.tx.neoSwaps.sell(
          effectivePoolId,
          categoryCount,
          selectedAsset,
          new Decimal(amount).mul(ZTG).toFixed(0),
          minPrice.mul(ZTG).toFixed(0),
          // selectedOrders.map(({ id }) => id),
          // "ImmediateOrCancel",
        );
      } else if (isCombinatorialToken(selectedAsset)) {
        // For combinatorial markets, filter out all other assets except the one we're selling
        // Consolidate asset sources to avoid duplication
        const sourceAssets = poolData?.assetIds || pool?.assetIds || [];

        // Filter for combinatorial tokens only, then exclude the selected asset
        // Two-step filtering ensures type safety for isEqualCombinatorialToken
        const allOtherAssets = sourceAssets
          .filter((assetId: any): assetId is CombinatorialToken =>
            isCombinatorialToken(assetId),
          )
          .filter(
            (assetId) => !isEqualCombinatorialToken(assetId, selectedAsset),
          );

        // comboSell semantics for selling a combinatorial position:
        // - buy: the asset we're reducing our position in (selling to get base currency)
        // - keep: assets we want to maintain (empty for full sell)
        // - sell: all other combinatorial assets we're simultaneously giving up
        // This allows the AMM to rebalance across all positions in the combo market
        return sdk.api.tx.neoSwaps.comboSell(
          effectivePoolId,
          categoryCount,
          [selectedAsset], // buy - asset being sold for base currency
          [], // keep - no assets held constant
          allOtherAssets, // sell - other combo assets being rebalanced
          new Decimal(amount).mul(ZTG).toFixed(0), // amount_buy - amount to sell
          0, // amount_keep - amount to keep constant (0 for pure sell)
          minPrice.mul(ZTG).toFixed(0), // min_amount_out - minimum base currency to receive
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

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (
        !changedByUser ||
        isUpdatingRef.current ||
        !selectedAssetBalance ||
        selectedAssetBalance.eq(0) ||
        !maxAmountIn
      )
        return;

      isUpdatingRef.current = true;

      try {
        if (name === "percentage" && value.percentage != null) {
          const max = selectedAssetBalance.greaterThan(maxAmountIn)
            ? maxAmountIn
            : selectedAssetBalance;
          setValue(
            "amount",
            Number(
              max
                .mul(Number(value.percentage))
                .abs()
                .div(100)
                .div(ZTG)
                .toFixed(3, Decimal.ROUND_DOWN),
            ),
          );
        } else if (name === "amount") {
          // Handle amount changes - convert to number and validate
          const amountValue = Number(value.amount);
          if (!isNaN(amountValue) && amountValue > 0) {
            setValue(
              "percentage",
              new Decimal(amountValue)
                .mul(ZTG)
                .div(selectedAssetBalance)
                .mul(100)
                .toString(),
            );
          } else {
            // Reset percentage to 0 when input is cleared or invalid
            setValue("percentage", "0");
          }
        }
        trigger("amount");
      } finally {
        isUpdatingRef.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedAssetBalance, maxAmountIn]);

  const onSubmit = () => {
    send();
  };
  return (
    <div className="flex w-full flex-col items-center gap-6 px-2 text-ztg-18-150 font-semibold text-white/90 md:px-0">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col items-center gap-y-4"
      >
        <div className="flex w-full items-center gap-3 md:gap-4">
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
          <div className="flex h-[56px] flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 text-xl font-bold text-white/90 shadow-lg shadow-black/20 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/15">
            {amountOut.div(ZTG).abs().toFixed(3)} {baseSymbol}
          </div>
        </div>
        <div className="relative w-full">
          <Input
            type="number"
            className="h-[56px] w-full rounded-lg border border-white/10 bg-white/10 px-4 text-center text-xl font-bold text-white/90 shadow-lg shadow-black/20 backdrop-blur-sm transition-all placeholder:text-white/50 focus:border-ztg-green-500/40 focus:bg-white/15 focus:shadow-lg focus:shadow-ztg-green-500/10 focus:outline-none"
            step="any"
            {...register("amount", {
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
        </div>
        <GlassSlider
          className="mb-[10px] mt-[30px] w-full"
          min="0"
          max="100"
          step="1"
          value={percentageValue}
          disabled={
            !selectedAssetBalance || selectedAssetBalance.lessThanOrEqualTo(0)
          }
          {...register("percentage")}
        />
        <div className="mb-4 flex w-full flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-medium shadow-md shadow-black/10 backdrop-blur-sm">
          <div className="h-4 text-xs font-semibold text-ztg-red-400">
            {formState.errors["amount"]?.message?.toString()}
          </div>
          <div className="flex w-full justify-between">
            <div className="text-white/90">Price after trade:</div>
            <div className="font-semibold text-white/90">
              {newSpotPrice?.toFixed(2)} ({priceImpact?.toFixed(2)}%)
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div className="text-white/90">Current shares:</div>
            <div className="font-semibold text-white/90">
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
          variant="red"
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
