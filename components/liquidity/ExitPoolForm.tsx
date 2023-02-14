import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk-next";
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
}: {
  poolBalances: PoolBalances;
  poolId: number;
}) => {
  const { register, watch, handleSubmit, setValue } = useForm();
  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotificationStore();

  const { send: joinPool, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.identity.setIdentity({});
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
      if (name === "sharesAmount" || name === "poolShares") return;

      const changedAsset = name;
      const changedByUser = type != null;

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
            type="number"
            {...register(id.toString(), { min: 0 })}
          />
        );
      })}
      <input type="range" {...register("sharesAmount", { min: 0 })} />;
    </form>
  );
};

export default ExitPoolForm;
