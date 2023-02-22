import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { poolTotalIssuanceRootQueryKey } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { assetObjStringToId, PoolBalances } from "./LiquidityModal";

const ExitPoolForm = ({
  poolBalances,
  poolId,
  totalPoolShares,
  userPoolShares,
  poolStatus,
}: {
  poolBalances: PoolBalances;
  poolId: number;
  totalPoolShares: Decimal;
  userPoolShares: Decimal;
  poolStatus: string;
}) => {
  const { config } = useStore();
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    getValues,

    formState,
  } = useForm({
    reValidateMode: "onChange",
    mode: "all",
  });
  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotificationStore();
  const userPercentageOwnership = userPoolShares.div(totalPoolShares);
  const { data: market } = useMarket({ poolId });
  const queryClient = useQueryClient();

  const { send: exitPool, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool) {
        const formValue = getValues();
        const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
        const feeMultiplier = 1 - config.swaps.exitFee;

        const minAssetsOut = pool?.weights.map((asset, index) => {
          const id = assetObjStringToId(asset.assetId);

          const assetAmount = formValue[id] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount)
                .mul(ZTG)
                .mul(slippageMultiplier)
                .mul(feeMultiplier)
                .toFixed(0, Decimal.ROUND_DOWN);
        });

        const poolSharesAmount = userPoolShares.mul(
          Number(formValue["poolSharesPercentage"]) / 100,
        );

        return sdk.api.tx.swaps.poolExit(
          poolId,
          poolSharesAmount.toFixed(0),
          minAssetsOut,
        );
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Exited pool", {
          type: "Success",
        });
        queryClient.invalidateQueries([
          id,
          poolTotalIssuanceRootQueryKey,
          poolId,
        ]);
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;
      if (name === "poolSharesPercentage" && changedByUser) {
        const percentage = Number(value["poolSharesPercentage"]);
        for (const assetKey in poolBalances) {
          setValue(
            assetKey,
            poolBalances[assetKey].pool
              .mul(userPercentageOwnership)
              .mul(percentage / 100)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
            { shouldValidate: true },
          );
        }
      } else {
        const changedAsset = name;

        const userInput = value[changedAsset];
        if (
          changedAsset != null &&
          userInput != null &&
          userInput !== "" &&
          changedByUser &&
          poolBalances
        ) {
          const changedAssetBalances = poolBalances[changedAsset];
          const poolToInputRatio = changedAssetBalances.pool
            .div(ZTG)
            .div(userInput);

          // recalculate asset amounts to keep ratio with user input
          for (const assetKey in poolBalances) {
            if (assetKey !== changedAsset) {
              setValue(
                assetKey,
                poolBalances[assetKey].pool
                  .div(poolToInputRatio)
                  .div(ZTG)
                  .toFixed(3, Decimal.ROUND_DOWN),
                { shouldValidate: true },
              );
            }
          }

          const userPoolBalance = changedAssetBalances.pool.mul(
            userPercentageOwnership,
          );

          const userPoolBalancePercentage = new Decimal(userInput)
            .mul(ZTG)
            .div(userPoolBalance);

          setValue(
            "poolSharesPercentage",
            userPoolBalancePercentage.mul(100).toString(),
          );
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, poolBalances]);

  const onSubmit: SubmitHandler<any> = () => {
    exitPool();
  };
  return (
    <form className="flex flex-col gap-y-6" onSubmit={handleSubmit(onSubmit)}>
      {pool?.weights.map((asset, index) => {
        const id = assetObjStringToId(asset.assetId);
        const assetName =
          market?.categories[index]?.name ?? pool.baseAsset.toUpperCase();

        if (!userPercentageOwnership || userPercentageOwnership.isNaN())
          return null;
        const poolAssetBalance =
          poolBalances?.[id]?.pool.div(ZTG) ?? new Decimal(0);
        const userBalanceInPool = poolAssetBalance
          .mul(userPercentageOwnership)
          .toNumber();

        return (
          <div
            key={index}
            className="w-full h-[56px] relative font-medium text-ztg-18-150"
          >
            <div className="absolute h-full left-[15px] top-[14px] truncate w-[40%]">
              {assetName}
            </div>
            <input
              className={`bg-anti-flash-white text-right rounded-[5px] h-full px-[15px] w-full
              ${
                formState.errors[id.toString()]?.message
                  ? "border-2 border-vermilion"
                  : ""
              }
              `}
              key={index}
              type="number"
              step="any"
              {...register(id.toString(), {
                value: 0,
                required: {
                  value: true,
                  message: "Value is required",
                },
                validate: (value: number) => {
                  if (value > userBalanceInPool) {
                    return `Insufficient pool shares. Max amount to withdraw is ${userBalanceInPool.toFixed(
                      3,
                    )}`;
                  } else if (value <= 0) {
                    return "Value cannot be zero or less";
                  } else if (
                    poolStatus.toLowerCase() === "active" &&
                    poolAssetBalance.minus(value).lessThanOrEqualTo(0.01)
                  ) {
                    return "Pool cannot be emptied completely whilst it's active";
                  }
                },
              })}
            />
            <div className="text-red-500 text-ztg-12-120 mt-[4px]">
              {formState.errors[id.toString()]?.message}
            </div>
          </div>
        );
      })}
      <input
        className="my-[20px]"
        type="range"
        {...register("poolSharesPercentage", { min: 0, value: "0" })}
      />
      <FormTransactionButton disabled={formState.isValid === false}>
        Exit Pool
      </FormTransactionButton>
    </form>
  );
};

export default ExitPoolForm;
