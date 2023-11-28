import { useQueryClient } from "@tanstack/react-query";
import {
  getIndexOf,
  IOBaseAssetId,
  IOCategoricalAssetId,
  isRpcSdk,
  parseAssetId,
  ZTG,
} from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { poolTotalIssuanceRootQueryKey } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { assetObjStringToId, PoolBalances } from "./LiquidityModal";

const ExitPoolForm = ({
  poolBalances,
  poolId,
  totalPoolShares,
  userPoolShares,
  baseAssetTicker,
  onSuccess,
}: {
  poolBalances: PoolBalances;
  poolId: number;
  totalPoolShares: Decimal;
  userPoolShares: Decimal;
  baseAssetTicker?: string;
  onSuccess?: () => void;
}) => {
  const { data: constants } = useChainConstants();
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
  const notificationStore = useNotifications();
  const userPercentageOwnership = userPoolShares.div(totalPoolShares);
  const { data: market } = useMarket({ poolId });
  const queryClient = useQueryClient();

  // filter out non-winning assets as they are deleted on chain
  const poolWeights =
    market?.status === "Resolved" && market.marketType.categorical
      ? pool?.weights.filter((weight) => {
          const assetId = weight && parseAssetId(weight.assetId).unwrap();

          return (
            IOBaseAssetId.is(assetId) ||
            (IOCategoricalAssetId.is(assetId) &&
              market.resolvedOutcome === getIndexOf(assetId).toString())
          );
        })
      : pool?.weights;

  const { send: exitPool, isLoading } = useExtrinsic(
    () => {
      if (!constants || !isRpcSdk(sdk) || !pool || !poolWeights) {
        return;
      }
      const formValue = getValues();
      const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
      const feeMultiplier = 1 - constants.swaps.exitFee;

      const minAssetsOut = poolWeights.map((asset) => {
        if (!asset) return "0";
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

      const poolSharesPercentage: string | undefined =
        formValue["poolSharesPercentage"];

      if (poolSharesPercentage == null) return;

      const poolSharesAmount = userPoolShares.mul(
        Number(poolSharesPercentage) / 100,
      );

      return sdk.api.tx.swaps.poolExit(
        poolId,
        poolSharesAmount.toFixed(0),
        minAssetsOut,
      );
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
        onSuccess?.();
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;
      if (!name) return;
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
      <div className="flex max-h-[200px] flex-col gap-y-6 overflow-y-auto py-5 md:max-h-[400px]">
        {poolWeights?.map((asset, index) => {
          if (!asset) return null;
          const id = assetObjStringToId(asset.assetId);
          const assetName =
            poolWeights.length - 1 === index
              ? baseAssetTicker
              : market?.categories?.[id].name;

          const poolAssetBalance =
            poolBalances?.[id]?.pool.div(ZTG) ?? new Decimal(0);
          const userBalanceInPool = poolAssetBalance
            .mul(userPercentageOwnership)
            .toNumber();

          return (
            <div
              key={index}
              className="relative h-[56px] w-full text-ztg-18-150 font-medium"
            >
              <div className="absolute left-[15px] top-[14px] h-full w-[40%] truncate capitalize">
                {assetName}
              </div>
              <Input
                className={`h-[56px] w-full rounded-[5px] bg-anti-flash-white px-[15px] text-right outline-none
              ${
                formState.errors[id.toString()]?.message
                  ? "border-2 border-vermilion text-vermilion"
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
                      market?.status.toLowerCase() !== "resolved" &&
                      poolAssetBalance.minus(value).lessThanOrEqualTo(0.01)
                    ) {
                      return "Pool cannot be emptied completely before the market resolves";
                    }
                  },
                })}
              />
              <div className="mt-[4px] text-ztg-12-120 text-red-500">
                <>{formState.errors[id.toString()]?.message}</>
              </div>
            </div>
          );
        })}
      </div>
      <input
        className="my-[20px]"
        type="range"
        {...register("poolSharesPercentage", { min: 0, value: "0" })}
      />
      <FormTransactionButton
        disabled={formState.isValid === false || isLoading}
      >
        Exit Pool
      </FormTransactionButton>
    </form>
  );
};

export default ExitPoolForm;
