import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { usePool } from "lib/hooks/queries/usePool";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
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
  const { register, watch, handleSubmit, setValue, getValues } = useForm();
  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotificationStore();
  const userPercentageOwnership = userPoolShares.div(totalPoolShares);
  console.log("ownership", userPercentageOwnership.toString());

  const { send: exitPool, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool) {
        const formValue = getValues();
        const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
        const amounts = pool?.weights.map((asset, index) => {
          const id = assetObjStringToId(asset.assetId);

          const assetAmount = formValue[id] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount)
                .mul(ZTG)
                .mul(slippageMultiplier)
                .toFixed(0);
        });
        return sdk.api.tx.swaps.poolExit(
          poolId,
          new Decimal(formValue["poolShares"]).mul(ZTG).toFixed(0),
          amounts,
        );
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Joined pool", {
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
              .toNumber(),
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
                  .toNumber(),
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

  const onSubmit: SubmitHandler<any> = (data) => console.log(data);

  return (
    <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      {pool?.weights.map((asset, index) => {
        const id = assetObjStringToId(asset.assetId);

        return (
          <input
            className="bg-blue-500 border border-black"
            key={index}
            type="text"
            {...register(id.toString(), { min: 0 })}
          />
        );
      })}
      {/* <input type="text" {...register("poolShares", { min: 0 })} /> */}
      <input type="range" {...register("poolSharesPercentage", { min: 0 })} />
    </form>
  );
};

export default ExitPoolForm;
