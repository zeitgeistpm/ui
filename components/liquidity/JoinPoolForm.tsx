import { ZTG } from "@zeitgeistpm/sdk-next";
import { usePool } from "lib/hooks/queries/usePool";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { assetObjStringToId, PoolBalances } from "./LiquidityModal";

const JoinPoolForm = ({
  poolBalances,
  poolId,
}: {
  poolBalances: PoolBalances;
  poolId: number;
}) => {
  const { register, watch, handleSubmit, setValue } = useForm();
  const { data: pool } = usePool({ poolId });

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log("watch", value, name, type);
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
    </form>
  );
};

export default JoinPoolForm;
