import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePool } from "lib/hooks/queries/usePool";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useStore } from "lib/stores/Store";
import { useEffect } from "react";
import {
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";

const LiquidityModal = ({ poolId }: { poolId: number }) => {
  const store = useStore();
  const connectedAddress = store.wallets.activeAccount?.address;
  const { data: pool } = usePool({ poolId });
  // pool balances
  const { data: poolAssetBalances } = useAccountPoolAssetBalances(
    pool?.accountId,
    pool,
  );
  const { data: poolBaseBalance } = useZtgBalance(pool?.accountId);

  const totalPoolIssuance = useTotalIssuanceForPools([poolId]);
  const userPoolTokens = useAccountAssetBalances(
    connectedAddress && pool != null
      ? [{ account: connectedAddress, assetId: { PoolShare: poolId } }]
      : [],
  );

  //user balances outside of pool
  const { data: userBaseBalance } = useZtgBalance(pool?.accountId);
  const userAssetBalances = useAccountAssetBalances(
    pool && connectedAddress
      ? pool?.weights.map((weight) => {
          return {
            account: connectedAddress,
            assetId: parseAssetId(weight.assetId).unwrap(),
          };
        })
      : [],
  );

  //   console.log(pool?.weights);

  const { register, control, handleSubmit, watch, setValue } = useForm<any>();

  const { fields, append, replace } = useFieldArray<any>({
    name: "assets",
    control,
  });

  useEffect(() => {
    if (fields?.length > 0) return;
    if (pool != null) {
      console.log("set amounts");

      pool.weights.map((weight) => {
        append({ assetId: weight.assetId, amount: 0 });
      });
    }
  }, [pool]);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log("watch", value, name, type);
      const changedAssetIndex = name.split(".")[1];

      console.log("changed", changedAssetIndex);

      if (changedAssetIndex != null) {
        // setValue("assets.2.amount", 5);
        // const newAssets = a
        replace(value.assets);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit: SubmitHandler<any> = (data) => console.log(data);
  return (
    <div>
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        {/* {pool?.weights.map((asset, index) => (
          <input
            // className="bg-blue-500 border border-black"
            // key={index}
            {...register(index.toString())}
          />
        ))} */}
        {fields.map((field, index) => (
          <input
            key={field.id}
            className="bg-blue-500 border border-black"
            type="number"
            {...register(`assets.${index}.amount` as const, {
              valueAsNumber: true,
              required: true,
            })}
            // autoFocus
          />
        ))}
      </form>
    </div>
  );
};

export default LiquidityModal;
