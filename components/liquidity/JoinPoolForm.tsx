import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { poolTotalIssuanceRootQueryKey } from "lib/hooks/queries/useTotalIssuanceForPools";
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
  const { register, watch, handleSubmit, setValue, getValues, formState } =
    useForm({ reValidateMode: "onChange", mode: "all" });
  // console.log("errors", formState.errors);

  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotificationStore();
  const [poolSharesToReceive, setPoolSharesToReceive] = useState<Decimal>();
  const { data: market } = useMarket({ poolId });
  const queryClient = useQueryClient();

  const { send: joinPool, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool) {
        const formValue = getValues();
        const maxAmountsIn = pool?.weights.map((asset, index) => {
          const id = assetObjStringToId(asset.assetId);
          console.log(formValue[id]);
          const assetAmount = formValue[id] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount)
                .mul(ZTG)
                .mul((100 + DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
                .toFixed(0);
        });
        console.log(maxAmountsIn);
        console.log(
          poolSharesToReceive
            .mul((100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
            .toFixed(0),
        );

        return sdk.api.tx.swaps.poolJoin(
          poolId,
          poolSharesToReceive
            // .mul((100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
            .toFixed(0),
          maxAmountsIn,
        );
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Joined pool", {
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

      const changedAsset = name;
      const userInput = value[changedAsset];

      if (name === "baseAssetPercentage" && changedByUser) {
        const percentage = Number(value["baseAssetPercentage"]);
        const userBaseAssetBalance = poolBalances[pool.baseAsset].user;

        const newBaseAssetAmount = userBaseAssetBalance.mul(percentage / 100);
        const baseBalances = poolBalances[pool.baseAsset];
        const poolToInputRatio = baseBalances.pool.div(newBaseAssetAmount);
        for (const assetKey in poolBalances) {
          setValue(
            assetKey,
            poolBalances[assetKey].pool
              .div(poolToInputRatio)
              .div(ZTG)
              .toFixed(3),
          );
        }
        setPoolSharesToReceive(totalPoolShares.div(poolToInputRatio));
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

        const userBaseAssetBalance = poolBalances[pool.baseAsset].user;
        const baseInputAmount = getValues(pool.baseAsset);

        setValue(
          "baseAssetPercentage",
          new Decimal(baseInputAmount)
            .div(userBaseAssetBalance.div(ZTG))
            .mul(100)
            .toString(),
        );
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
            <div className="text-red-500 text-ztg-12-120">
              {formState.errors[id.toString()]?.type}
            </div>
          </div>
        );
      })}
      <input type="range" {...register("baseAssetPercentage", { min: 0 })} />
      <button type="submit">Submit</button>
    </form>
  );
};

export default JoinPoolForm;
