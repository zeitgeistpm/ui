import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
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
      onError: (error) => {
        notificationStore.pushNotification(
          `Failed to join pool: ${error?.message || "Unknown error"}`,
          { type: "Error" },
        );
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (!name || !allBalancesLoaded) return;
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

      const maxInForRestrictiveAsset = validBalances[restrictiveIndex!];

      if (name === "percentage" && changedByUser) {
        const percentage = Number(value["percentage"]);
        const restrictiveAssetAmount = maxInForRestrictiveAsset.mul(
          percentage / 100,
        );
        const restrictiveAssetToPoolRatio = restrictiveAssetAmount.div(
          reserves[restrictiveIndex!],
        );

        reserves.forEach((reserve, index) => {
          setValue(
            index.toString(),
            reserve
              .mul(restrictiveAssetToPoolRatio)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
            { shouldValidate: true },
          );
        });

        setPoolSharesToReceive(
          pool.totalShares.mul(restrictiveAssetToPoolRatio),
        );
      } else if (
        changedAsset != null &&
        userInput != null &&
        userInput !== "" &&
        changedByUser &&
        userAssetBalances
      ) {
        const reserve = reserves[Number(changedAsset)];
        const inputToReserveRatio = new Decimal(userInput)
          .div(reserve)
          .mul(ZTG);

        let restrictedAssetAmount: Decimal | undefined;
        reserves.forEach((reserve, index) => {
          const amount = reserve.mul(inputToReserveRatio).div(ZTG);

          if (index.toString() !== changedAsset) {
            setValue(index.toString(), amount.toFixed(3, Decimal.ROUND_DOWN), {
              shouldValidate: true,
            });
          }

          if (index === restrictiveIndex) {
            restrictedAssetAmount = amount;
          }
        });
        setPoolSharesToReceive(pool.totalShares.mul(inputToReserveRatio));

        setValue(
          "percentage",
          restrictedAssetAmount
            ?.div(maxInForRestrictiveAsset.div(ZTG))
            .mul(100)
            .toString(),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, userAssetBalances, pool]);

  const onSubmit: SubmitHandler<any> = () => {
    joinPool();
  };

  const prctSharesToReceive = useMemo(() => {
    if (!poolSharesToReceive) return new Decimal(0);
    return poolSharesToReceive
      .div(pool.totalShares.plus(poolSharesToReceive))
      .mul(100);
  }, [pool.totalShares, poolSharesToReceive]);

  const hasInsufficientBalance = useMemo(() => {
    if (!allBalancesLoaded) return true;
    return userAssetBalances.some((balance) => !balance || balance.isZero());
  }, [userAssetBalances, allBalancesLoaded]);

  return (
    <form
      className="flex flex-col gap-y-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex max-h-[220px] flex-col gap-y-3 overflow-y-auto py-2 md:max-h-[300px]">
        {activeMarket &&
          pool?.assetIds.map((assetId, index) => {
            const assetName = virtualMarket
              ? activeMarket.categories?.[index]?.name
              : lookupAssetMetadata(activeMarket, assetId)?.name;
            const userBalance = userAssetBalances[index]?.div(ZTG).toNumber();

            return (
              <div
                key={index}
                className="relative h-[52px] w-full text-sm font-semibold"
              >
                <div className="absolute left-3 top-[14px] z-10 w-[40%] truncate capitalize text-white/90">
                  {assetName}
                </div>
                <Input
                  className={`h-11 w-full rounded-lg border-2 px-3 text-right text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-all focus:shadow-md focus:outline-none
                            ${
                              formState.errors[index.toString()]?.message
                                ? "border-ztg-red-500/60 bg-ztg-red-900/30 text-ztg-red-400 focus:border-ztg-red-500/80"
                                : "border-white/10 bg-white/10 text-white/90 hover:bg-white/15 focus:bg-white/15 focus:border-white/20 focus:ring-2 focus:ring-white/10"
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
                <div className="mt-1 text-xs font-medium text-ztg-red-400">
                  <>{formState.errors[index.toString()]?.message}</>
                </div>
              </div>
            );
          })}
      </div>
      <input
        className="my-3 w-full cursor-pointer accent-white/80 disabled:cursor-not-allowed disabled:opacity-50"
        type="range"
        disabled={!allBalancesLoaded}
        {...register("percentage", { min: 0, max: 100, value: "0" })}
      />
      {activeMarket?.status !== "Active" && (
        <div className="rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-3 text-xs text-orange-400 shadow-sm backdrop-blur-sm">
          Liquidity cannot be provided to a closed market
        </div>
      )}
      {hasInsufficientBalance && activeMarket?.status === "Active" && (
        <div className="rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-3 shadow-sm backdrop-blur-sm">
          <div className="mb-1.5 text-xs font-semibold text-orange-400">
            Missing Required Assets
          </div>
          <div className="text-xs text-orange-300">
            You must hold a balance in <strong>all</strong> pool assets to
            provide liquidity. Please acquire the missing tokens before joining
            the pool.
          </div>
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border-2 border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-sm">
        <label className="text-xs font-semibold text-white/90">
          Expected Pool Ownership
        </label>
        <span className="text-sm font-bold text-white">
          {prctSharesToReceive?.toFixed(1) ?? "0.0"}%
        </span>
      </div>

      <FormTransactionButton
        loading={isLoading}
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
