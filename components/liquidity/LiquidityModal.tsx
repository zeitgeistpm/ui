import {
  getIndexOf,
  IOMarketOutcomeAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePool } from "lib/hooks/queries/usePool";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useStore } from "lib/stores/Store";
import { useMemo } from "react";
import ExitPoolForm from "./ExitPoolForm";
import JoinPoolForm from "./JoinPoolForm";

export type PoolBalances = {
  [key: string]: {
    pool: Decimal; // pool total balance
    user: Decimal; // user balance outside pool
  };
};

export const assetObjStringToId = (assetId: string) => {
  const asset = parseAssetId(assetId).unwrap();
  return IOMarketOutcomeAssetId.is(asset) ? getIndexOf(asset) : "base";
};

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
  const totalPoolIssuance = data?.[poolId]?.data?.totalIssuance;
  const userPoolTokensQuery = useAccountAssetBalances(
    connectedAddress && pool != null
      ? [{ account: connectedAddress, assetId: { PoolShare: poolId } }]
      : [],
  );

  const userPoolTokens: string = userPoolTokensQuery
    ?.get(connectedAddress, {
      PoolShare: poolId,
    })
    ?.data.balance.free.toString();

  //user balances outside of pool
  const { data: userBaseBalance } = useZtgBalance(connectedAddress);
  const { data: userAssetBalances } = useAccountPoolAssetBalances(
    connectedAddress,
    pool,
  );

  const allBalances: PoolBalances = useMemo(() => {
    if (
      pool?.weights &&
      userBaseBalance &&
      userAssetBalances?.length > 0 &&
      poolAssetBalances?.length > 0 &&
      poolBaseBalance
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

  return (
    <div>
      <JoinPoolForm
        poolId={poolId}
        poolBalances={allBalances}
        totalPoolShares={new Decimal(totalPoolIssuance?.toString() ?? 0)}
      />
      <ExitPoolForm
        poolId={poolId}
        poolStatus={pool?.poolStatus}
        poolBalances={allBalances}
        totalPoolShares={new Decimal(totalPoolIssuance?.toString() ?? 0)}
        userPoolShares={new Decimal(userPoolTokens?.toString() ?? 0)}
      />
    </div>
  );
};

export default LiquidityModal;
