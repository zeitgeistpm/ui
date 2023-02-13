import { getIndexOf, isNA, parseAssetId } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useStore } from "lib/stores/Store";
import { useEffect, useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type AssetBalances = { [key: string]: Decimal };
type PoolBalances = {
  [key: string]: {
    pool: Decimal;
    user: Decimal;
  };
};

type Balances = {
  pool: AssetBalances;
  user: AssetBalances;
};

const assetObjStringToId = (assetId: string) => {
  const asset = parseAssetId(assetId).unwrap();
  const id = getIndexOf(asset) ?? assetId;
  return id;
};

const b: Balances = {
  pool: { a: new Decimal(0), b: new Decimal(0) },
  user: { a: new Decimal(0) },
};
const LiquidityModal = ({ poolId }: { poolId: number }) => {
  const store = useStore();

  const connectedAddress = store.wallets.activeAccount?.address;
  const { data: pool } = usePool({ poolId });
  const { data: market } = useMarket({ poolId });

  // pool balances
  const { data: poolAssetBalances } = useAccountPoolAssetBalances(
    pool?.accountId,
    pool,
  );

  const { data: poolBaseBalance } = useZtgBalance(pool?.accountId);

  const data = useTotalIssuanceForPools([poolId]);
  const totalPoolIssuance = data?.[poolId]?.data?.totalIssuance;
  const userPoolTokens = useAccountAssetBalances(
    connectedAddress && pool != null
      ? [{ account: connectedAddress, assetId: { PoolShare: poolId } }]
      : [],
  );

  //user balances outside of pool
  const { data: userBaseBalance } = useZtgBalance(pool?.accountId);
  const { data: userAssetBalances } = useAccountPoolAssetBalances(
    connectedAddress,
    pool,
  );

  const allBalances: PoolBalances = useMemo(() => {
    if (
      pool?.weights &&
      !isNA(userBaseBalance) &&
      userAssetBalances?.length > 0 &&
      poolAssetBalances?.length > 0 &&
      !isNA(poolBaseBalance)
    ) {
      const allBalances: PoolBalances = pool.weights.reduce(
        (balances, weight, index) => {
          const isBaseAsset = index === pool.weights.length - 1;

          const userBalance = isBaseAsset
            ? userBaseBalance
            : new Decimal(userAssetBalances[index].free.toString());
          const poolBalance = isBaseAsset
            ? new Decimal(poolBaseBalance.toString())
            : new Decimal(poolAssetBalances[index].free.toString());

          const id = assetObjStringToId(weight.assetId);

          balances[id] = {
            pool: poolBalance,
            user: userBalance,
          };
          return balances;
        },
        {},
      );

      return allBalances;
    }
  }, [
    pool?.weights,
    userAssetBalances,
    userBaseBalance,
    poolAssetBalances,
    poolBaseBalance,
  ]);

  console.log(allBalances);

  const { register, watch, handleSubmit, setValue } = useForm();

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log("watch", value, name, type);
      const changedAsset = name;
      const assetAmount = value;
      const changedByUser = type != null;

      // console.log(allBalances[name].pool);
      // console.log(allBalances[name].user);
      // const poolAssetAmount;

      // const poolToUserRatio =

      // console.log("changed", changedAssetIndex);

      const userInput = value[changedAsset];
      if (
        changedAsset != null &&
        userInput != null &&
        userInput !== "" &&
        changedByUser &&
        allBalances
      ) {
        const changedAssetBalances = allBalances[changedAsset];

        console.log(
          "poolAmount",
          changedAssetBalances.pool.div(ZTG).toString(),
        );
        console.log(userInput);

        const poolToInputRatio = changedAssetBalances.pool
          .div(ZTG)
          .div(userInput);
        console.log(poolToInputRatio.toString());

        // recalculate asset amounts to keep ratio with user input
        for (const assetKey in allBalances) {
          console.log(assetKey);
          console.log(allBalances[assetKey].pool.div(ZTG).toString());

          if (assetKey !== changedAsset) {
            setValue(
              assetKey,
              allBalances[assetKey].pool
                .div(poolToInputRatio)
                .div(ZTG)
                .toNumber(),
            );
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, allBalances]);

  const onSubmit: SubmitHandler<any> = (data) => console.log(data);
  return (
    <div>
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
    </div>
  );
};

export default LiquidityModal;
