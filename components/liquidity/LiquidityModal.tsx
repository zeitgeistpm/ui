import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePool } from "lib/hooks/queries/usePool";
import { useTotalIssuanceForPools } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useStore } from "lib/stores/Store";

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

  return <div>yo</div>;
};

export default LiquidityModal;
