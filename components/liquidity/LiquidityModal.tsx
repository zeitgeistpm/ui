import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePool } from "lib/hooks/queries/usePool";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useStore } from "lib/stores/Store";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

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

  const data = useTotalIssuanceForPools([poolId]);
  const totalPoolIssuance = data?.[pool.poolId]?.data.totalIssuance;
  const userPoolTokens = useAccountAssetBalances(
    connectedAddress && pool != null
      ? [{ account: connectedAddress, assetId: { PoolShare: poolId } }]
      : [],
  );

  console.log("total", totalPoolIssuance.toNumber());
  console.log(
    "poolAssets",
    poolAssetBalances.map((a) => a.free.toString()),
  );
  console.log("poolBase", poolBaseBalance.toString());

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

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log("watch", value, name, type);
      const changedAssetIndex = name;
      const assetAmount = value;
      const poolAssetAmount;

      // const poolToUserRatio =

      // console.log("changed", changedAssetIndex);

      if (changedAssetIndex != null && type != null) {
        setValue("1", 5);
        // const newAssets = a
        // replace(value.assets);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit: SubmitHandler<any> = (data) => console.log(data);
  return (
    <div>
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        {pool?.weights.map((asset, index) => (
          <input
            className="bg-blue-500 border border-black"
            key={index}
            type="number"
            {...(register(index.toString()), { defaultValue: 0 })}
          />
        ))}
      </form>
    </div>
  );
};

export default LiquidityModal;
