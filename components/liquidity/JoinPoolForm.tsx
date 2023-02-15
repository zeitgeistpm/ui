import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { assetObjStringToId, PoolBalances } from "./LiquidityModal";

const JoinPoolForm = ({
  poolBalances,
  poolId,
  totalPoolShares,
}: {
  poolBalances: PoolBalances;
  poolId: number;
  totalPoolShares: Decimal;
}) => {
  console.log("id", poolId);
  console.log(poolBalances);

  const { register, watch, handleSubmit, setValue, getValues } = useForm();
  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotificationStore();
  const [poolSharesToReceive, setPoolSharesToReceive] = useState<Decimal>();
  const { data: market } = useMarket({ poolId });

  const { send: joinPool, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool) {
        const formValue = getValues();
        const amounts = pool?.weights.map((asset, index) => {
          const id = assetObjStringToId(asset.assetId);
          const assetAmount = formValue[id] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount).mul(ZTG).toFixed(0);
        });

        return sdk.api.tx.swaps.poolJoin(
          poolId,
          poolSharesToReceive
            .mul((100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
            .toFixed(0),
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
      console.log("watch", value, name, type);
      const changedByUser = type != null;

      const changedAsset = name;
      const userInput = value[changedAsset];

      if (name === "baseAssetPercentage" && changedByUser) {
        const percentage = Number(value["baseAssetPercentage"]);
        const userBaseAssetBalance = poolBalances[pool.baseAsset].user;

        const newBaseAssetAmount = userBaseAssetBalance.mul(percentage / 100);
        const changedAssetBalances = poolBalances[pool.baseAsset];
        const poolToInputRatio =
          changedAssetBalances.pool.div(newBaseAssetAmount);
        for (const assetKey in poolBalances) {
          setValue(
            assetKey,
            poolBalances[assetKey].pool
              .div(poolToInputRatio)
              .div(ZTG)
              .toFixed(3),
          );
        }
      } else if (
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
                .toFixed(3),
            );
          }
        }

        setPoolSharesToReceive(totalPoolShares.div(poolToInputRatio));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, poolBalances]);

  const onSubmit: SubmitHandler<any> = (data) => {
    joinPool();
  };

  return (
    <form className="flex flex-col gap-y-3" onSubmit={handleSubmit(onSubmit)}>
      {pool?.weights.map((asset, index) => {
        const id = assetObjStringToId(asset.assetId);
        const assetName =
          market?.categories[index]?.name ?? pool.baseAsset.toUpperCase();

        return (
          <div className="w-full h-[56px] relative font-medium text-ztg-18-150">
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
      <input type="range" {...register("baseAssetPercentage", { min: 0 })} />
      <button type="submit">Submit</button>
    </form>
  );
};

export default JoinPoolForm;
