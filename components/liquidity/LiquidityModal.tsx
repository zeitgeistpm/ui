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
import ExitPoolForm from "./ExitPoolForm";
import JoinPoolForm from "./JoinPoolForm";

export type PoolBalances = {
  [key: string]: {
    pool: Decimal;
    user: Decimal;
  };
};

export const assetObjStringToId = (assetId: string) => {
  const asset = parseAssetId(assetId).unwrap();
  const id = getIndexOf(asset) ?? assetId;
  return id;
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

  return (
    <div>
      <JoinPoolForm poolId={poolId} poolBalances={allBalances} />
      <ExitPoolForm poolId={poolId} poolBalances={allBalances} />
    </div>
  );
};

export default LiquidityModal;
