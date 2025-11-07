import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import GlassSlider from "components/ui/GlassSlider";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { Amm2Pool, amm2PoolKey } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useBalances } from "lib/hooks/queries/useBalances";
import { lookupAssetMetadata, useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { isPresent } from "lib/types";
import { calculateRestrictivePoolAsset } from "lib/util/calculate-restrictive-pool-asset";
import { getPoolIdForTransaction } from "lib/util/get-pool-id";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

const JoinPoolForm = ({
  marketId,
  pool,
  baseAssetTicker,
  onSuccess,
  virtualMarket,
}: {
  marketId: number;
  pool: Amm2Pool;
  baseAssetTicker?: string;
  onSuccess?: () => void;
  virtualMarket?: any;
}) => {
  const wallet = useWallet();
  const { register, watch, handleSubmit, setValue, getValues, formState } =
    useForm({ reValidateMode: "onChange", mode: "all" });
  const percentageValueRaw = watch("percentage");
  const percentageValue = useMemo(() => {
    if (!percentageValueRaw) return "0";
    const numValue = Number(percentageValueRaw);
    if (isNaN(numValue) || !isFinite(numValue)) return "0";
    // Clamp between 0 and 100
    const clamped = Math.max(0, Math.min(100, numValue));
    return clamped.toString();
  }, [percentageValueRaw]);
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const [poolSharesToReceive, setPoolSharesToReceive] = useState<Decimal>();
  const { data: market } = useMarket({ marketId });
  const activeMarket = virtualMarket || market;

  const userAssetBalancesQueries = useBalances(
    pool.assetIds,
    wallet.realAddress,
  );
  const userAssetBalances = userAssetBalancesQueries.map((res) => res.data);
  const allBalancesLoaded = userAssetBalances.every((balance) =>
    isPresent(balance),
  );

  const queryClient = useQueryClient();

  const hasInsufficientBalance = useMemo(() => {
    if (!allBalancesLoaded) return true;
    return userAssetBalances.some((balance) => !balance || balance.isZero());
  }, [userAssetBalances, allBalancesLoaded]);

  const { send: joinPool, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool && poolSharesToReceive) {
        const formValue = getValues();
        const maxAmountsIn = pool?.assetIds.map((assetId, index) => {
          const assetAmount = formValue[index] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount).mul(ZTG).toFixed(0);
        });

        const poolIdForTx = getPoolIdForTransaction(pool, marketId);

        try {
          return sdk.api.tx.neoSwaps.join(
            poolIdForTx,
            poolSharesToReceive
              .mul((100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
              .toFixed(0),
            maxAmountsIn,
          );
        } catch (error) {
          console.error("JoinPool - Error creating transaction:", error);
        }
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Joined pool", {
          type: "Success",
        });
        // Invalidate pool query
        queryClient.invalidateQueries([id, amm2PoolKey, marketId]);
        // Invalidate balance queries for all pool assets
        queryClient.invalidateQueries({ queryKey: [id, "balance"] });
        onSuccess?.();
      },
      onError: () => {
        // Error notification is already handled by useExtrinsic hook
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (!name || !allBalancesLoaded || hasInsufficientBalance) return;
      const changedByUser = type != null;
      const changedAsset = name;
      const userInput = value[changedAsset];
      const reserves = Array.from(pool.reserves).map((reserve) => reserve[1]);

      // Filter to get valid balances for calculation
      const validBalances = userAssetBalances.filter(isPresent);
      const restrictiveIndex = calculateRestrictivePoolAsset(
        reserves,
        validBalances,
      );

      // Guard against undefined restrictiveIndex or invalid balances
      if (restrictiveIndex == null || restrictiveIndex < 0) return;
      
      const maxInForRestrictiveAsset = validBalances[restrictiveIndex];
      
      // Guard against zero or invalid balance
      if (!maxInForRestrictiveAsset || maxInForRestrictiveAsset.isZero() || !maxInForRestrictiveAsset.isFinite()) {
        return;
      }

      // Guard against zero reserve
      const restrictiveReserve = reserves[restrictiveIndex];
      if (!restrictiveReserve || restrictiveReserve.isZero() || !restrictiveReserve.isFinite()) {
        return;
      }

      if (name === "percentage" && changedByUser) {
        const percentage = Number(value["percentage"]);
        
        // Guard against invalid percentage
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          return;
        }
        
        const restrictiveAssetAmount = maxInForRestrictiveAsset.mul(
          percentage / 100,
        );
        const restrictiveAssetToPoolRatio = restrictiveAssetAmount.div(
          restrictiveReserve,
        );

        // Guard against invalid ratio
        if (!restrictiveAssetToPoolRatio.isFinite() || restrictiveAssetToPoolRatio.isNaN()) {
          return;
        }

        reserves.forEach((reserve, index) => {
          const calculatedValue = reserve
            .mul(restrictiveAssetToPoolRatio)
            .div(ZTG);
          
          if (calculatedValue.isFinite() && !calculatedValue.isNaN()) {
            setValue(
              index.toString(),
              calculatedValue.toFixed(3, Decimal.ROUND_DOWN),
              { shouldValidate: true },
            );
          }
        });

        const sharesToReceive = pool.totalShares.mul(restrictiveAssetToPoolRatio);
        if (sharesToReceive.isFinite() && !sharesToReceive.isNaN()) {
          setPoolSharesToReceive(sharesToReceive);
        }
      } else if (
        changedAsset != null &&
        userInput != null &&
        userInput !== "" &&
        changedByUser &&
        userAssetBalances
      ) {
        const reserve = reserves[Number(changedAsset)];
        
        // Guard against invalid reserve or input
        if (!reserve || reserve.isZero() || !reserve.isFinite()) {
          return;
        }
        
        const inputDecimal = new Decimal(userInput);
        if (inputDecimal.isNaN() || !inputDecimal.isFinite() || inputDecimal.lte(0)) {
          return;
        }

        const inputToReserveRatio = inputDecimal
          .div(reserve)
          .mul(ZTG);

        // Guard against invalid ratio
        if (!inputToReserveRatio.isFinite() || inputToReserveRatio.isNaN() || inputToReserveRatio.isZero()) {
          return;
        }

        let restrictedAssetAmount: Decimal | undefined;
        reserves.forEach((reserve, index) => {
          const amount = reserve.mul(inputToReserveRatio).div(ZTG);

          if (index.toString() !== changedAsset && amount.isFinite() && !amount.isNaN()) {
            setValue(index.toString(), amount.toFixed(3, Decimal.ROUND_DOWN), {
              shouldValidate: true,
            });
          }

          if (index === restrictiveIndex) {
            restrictedAssetAmount = amount;
          }
        });
        
        const sharesToReceive = pool.totalShares.mul(inputToReserveRatio);
        if (sharesToReceive.isFinite() && !sharesToReceive.isNaN()) {
          setPoolSharesToReceive(sharesToReceive);
        }

        if (restrictedAssetAmount && restrictedAssetAmount.isFinite() && !restrictedAssetAmount.isNaN()) {
          const maxInForDisplay = maxInForRestrictiveAsset.div(ZTG);
          if (!maxInForDisplay.isZero() && maxInForDisplay.isFinite()) {
            const percentageValue = restrictedAssetAmount
              .div(maxInForDisplay)
              .mul(100);
            
            if (percentageValue.isFinite() && !percentageValue.isNaN()) {
              const percentageString = percentageValue.toString();
              // Ensure it's a valid number string
              const percentageNum = Number(percentageString);
              if (!isNaN(percentageNum) && percentageNum >= 0 && percentageNum <= 100) {
                setValue("percentage", percentageString);
              }
            }
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, userAssetBalances, pool, allBalancesLoaded, hasInsufficientBalance]);

  const onSubmit: SubmitHandler<any> = () => {
    joinPool();
  };

  const prctSharesToReceive = useMemo(() => {
    if (!poolSharesToReceive || poolSharesToReceive.isNaN() || !poolSharesToReceive.isFinite()) {
      return new Decimal(0);
    }
    const totalWithNewShares = pool.totalShares.plus(poolSharesToReceive);
    if (totalWithNewShares.isZero() || !totalWithNewShares.isFinite()) {
      return new Decimal(0);
    }
    const percentage = poolSharesToReceive
      .div(totalWithNewShares)
      .mul(100);
    return percentage.isFinite() && !percentage.isNaN() ? percentage : new Decimal(0);
  }, [pool.totalShares, poolSharesToReceive]);

  return (
    <form className="flex flex-col gap-y-3 min-w-0 w-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex max-h-[220px] flex-col gap-y-3 overflow-y-auto no-scroll-bar py-2 md:max-h-[350px]">
        {activeMarket &&
          pool?.assetIds.map((assetId, index) => {
            const assetName = virtualMarket
              ? activeMarket.categories?.[index]?.name
              : lookupAssetMetadata(activeMarket, assetId)?.name;
            const userBalance = userAssetBalances[index]?.div(ZTG).toNumber();
            const hasError = !!formState.errors[index.toString()]?.message;

            return (
              <div
                key={index}
                className="relative w-full"
              >
                <div className="relative h-ztg-40">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-[40%] truncate capitalize text-xs leading-tight text-white/90 pointer-events-none">
                    {assetName}
                  </div>
                  <Input
                    className={`h-ztg-40 w-full rounded-lg border-2 px-3 py-0 text-right text-xs leading-none font-medium text-white shadow-sm backdrop-blur-sm transition-all focus:shadow-md focus:outline-none
                            ${
                              hasError
                                ? "border-ztg-red-500/60 bg-ztg-red-900/30 text-ztg-red-400 focus:border-ztg-red-500/80"
                                : "border-white/10 bg-white/10 text-white/90 hover:bg-white/15 focus:border-white/20 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                            }
              `}
                    key={index}
                    type="number"
                    step="any"
                    {...register(index.toString(), {
                      value: 0,
                      required: {
                        value: true,
                        message: "Value is required",
                      },
                    validate: (value) => {
                      if (userBalance == null) {
                        return "Balance not available";
                      }
                      if (value > userBalance) {
                        return `Insufficient balance. Current balance: ${userBalance.toFixed(
                          3,
                        )}`;
                      } else if (value <= 0) {
                        return "Value cannot be zero or less";
                      }
                    },
                    })}
                  />
                </div>
                {hasError && (
                  <div className="mt-1.5 mb-0.5 text-xs md:text-sm font-medium text-ztg-red-400 min-h-[1.25rem]">
                    {String(formState.errors[index.toString()]?.message || '')}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <GlassSlider
        className="w-full"
        min="0"
        max="100"
        step="1"
        value={percentageValue}
        disabled={!allBalancesLoaded || hasInsufficientBalance}
        {...register("percentage", { min: 0, max: 100, value: "0" })}
      />
      {activeMarket?.status !== "Active" && (
        <div className="rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-2.5 text-xs text-orange-400 shadow-sm backdrop-blur-sm">
          Liquidity cannot be provided to a closed market
        </div>
      )}
      {hasInsufficientBalance && activeMarket?.status === "Active" && (
        <div className="rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-2.5 shadow-sm backdrop-blur-sm">
          <div className="mb-1.5 text-xs font-semibold text-orange-400">
            Missing Required Assets
          </div>
          <div className="text-xs text-orange-300 leading-relaxed">
            You must hold a balance in <strong>all</strong> pool assets to
            provide liquidity. Please acquire the missing tokens before joining
            the pool.
          </div>
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border-2 border-white/10 bg-white/10 p-2.5 shadow-sm backdrop-blur-sm">
        <label className="text-xs font-semibold text-white/90">
          Expected Pool Ownership
        </label>
        <span className="text-xs font-bold text-white">
          {prctSharesToReceive?.toFixed(1) ?? "0.0"}%
        </span>
      </div>

      <FormTransactionButton
        loading={isLoading}
        className="!h-10 !text-sm !font-medium"
        disabled={
          formState.isValid === false ||
          isLoading ||
          activeMarket?.status !== "Active" ||
          hasInsufficientBalance
        }
      >
        Join Pool
      </FormTransactionButton>
    </form>
  );
};

export default JoinPoolForm;
