import { Dialog, Tab } from "@headlessui/react";
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
import { useWallet } from "lib/state/wallet";
import { useMemo } from "react";
import ExitPoolForm from "./ExitPoolForm";
import JoinPoolForm from "./JoinPoolForm";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";

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
  const wallet = useWallet();
  const connectedAddress = wallet.activeAccount?.address;
  const { data: pool } = usePool({ poolId });

  // pool balances
  const { data: poolAssetBalances } = useAccountPoolAssetBalances(
    pool?.accountId,
    pool,
  );

  const { data: poolBaseBalance } = usePoolBaseBalance(poolId);

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

  const baseAsset = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAsset);

  //user balances outside of pool
  const { data: userBaseBalance } = useBalance(
    wallet.activeAccount?.address,
    baseAsset,
  );
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
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
      <Tab.Group>
        <Tab.List className="flex h-[71px] text-center font-medium text-ztg-18-150">
          <Tab className="ui-selected:font-bold ui-selected:bg-white bg-anti-flash-white transition-all w-1/2 rounded-tl-[10px]">
            Join
          </Tab>
          <Tab className="ui-selected:font-bold ui-selected:bg-white bg-anti-flash-white transition-all w-1/2 rounded-tr-[10px]">
            Exit
          </Tab>
        </Tab.List>

        <Tab.Panels className="p-[30px]">
          <Tab.Panel>
            <JoinPoolForm
              poolId={poolId}
              poolBalances={allBalances}
              totalPoolShares={new Decimal(totalPoolIssuance?.toString() ?? 0)}
              baseAssetTicker={metadata.symbol}
            />
          </Tab.Panel>
          <Tab.Panel>
            <ExitPoolForm
              poolId={poolId}
              poolStatus={pool?.poolStatus}
              poolBalances={allBalances}
              totalPoolShares={new Decimal(totalPoolIssuance?.toString() ?? 0)}
              userPoolShares={new Decimal(userPoolTokens?.toString() ?? 0)}
              baseAssetTicker={metadata.symbol}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </Dialog.Panel>
  );
};

export default LiquidityModal;
