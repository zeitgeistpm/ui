import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
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
}: {
  poolBalances: PoolBalances;
  poolId: number;
  totalPoolShares: Decimal;
  userPoolShares: Decimal;
}) => {
  const { config } = useStore();
  const { register, watch, handleSubmit, setValue, getValues } = useForm();
  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotificationStore();
  const userPercentageOwnership = userPoolShares.div(totalPoolShares);
  const { data: market } = useMarket({ poolId });

  const { send: exitPool, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool) {
        const formValue = getValues();
        const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
        const feeMultiplier = 1 - config.swaps.exitFee;
        console.log(
          new Decimal(1).mul(slippageMultiplier).mul(feeMultiplier).toString(),
        );

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
        console.log(poolSharesAmount.toFixed(0), minAssetsOut);

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

  const onSubmit: SubmitHandler<any> = (data) => {
    exitPool();
  };
  return (
    <form className="flex flex-col gap-y-3" onSubmit={handleSubmit(onSubmit)}>
      {pool?.weights.map((asset, index) => {
        const id = assetObjStringToId(asset.assetId);
        const assetName =
          market?.categories[index]?.name ?? pool.baseAsset.toUpperCase();

        return (
          <div
            key={index}
            className="w-full h-[56px] relative font-medium text-ztg-18-150"
          >
            <div className="absolute h-full left-[15px] top-[14px]">
              {assetName}
            </div>
            <input
              className="bg-anti-flash-white text-right rounded-[5px] h-full px-[15px] w-full"
              key={index}
              type="number"
              step="any"
              {...register(id.toString(), { min: 0 })}
            />
          </div>
        );
      })}
      <input type="range" {...register("poolSharesPercentage", { min: 0 })} />
      <button type="submit">Submit</button>
    </form>
  );
};

export default ExitPoolForm;
