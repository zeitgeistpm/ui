import { Dialog, Tab } from "@headlessui/react";
import {
  getIndexOf,
  IOMarketOutcomeAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useAccountAssetBalances } from "lib/hooks/queries/useAccountAssetBalances";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePool } from "lib/hooks/queries/usePool";
import { useWallet } from "lib/state/wallet";
import { useMemo } from "react";
import ExitPoolForm from "./ExitPoolForm";
import JoinPoolForm from "./JoinPoolForm";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import Modal from "components/ui/Modal";
import { useTotalIssuance } from "lib/hooks/queries/useTotalIssuance";

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

const LiquidityModal = ({
  open,
  onClose,
  poolId,
}: {
  open: boolean;
  onClose: () => void;
  poolId: number;
}) => {
  const wallet = useWallet();
  const connectedAddress = wallet.realAddress;
  const { data: pool } = usePool({ poolId });

  // pool balances
  const { data: poolAssetBalances } = useAccountPoolAssetBalances(
    pool?.account.accountId,
    pool,
  );

  const { data: poolBaseBalance } = usePoolBaseBalance(poolId);

  const userPoolTokensQuery = useAccountAssetBalances([
    { account: connectedAddress, assetId: { PoolShare: poolId } },
  ]);

  const { data: totalPoolIssuance } = useTotalIssuance({ PoolShare: poolId });

  const userPoolTokens =
    connectedAddress &&
    userPoolTokensQuery
      ?.get(connectedAddress, {
        PoolShare: poolId,
      })
      ?.data?.balance?.free.toString();

  const baseAsset = pool && parseAssetId(pool.baseAsset).unrightOr(undefined);

  const { data: metadata } = useAssetMetadata(baseAsset);

  //user balances outside of pool
  const { data: userBaseBalance } = useBalance(connectedAddress, baseAsset);
  const { data: userAssetBalances } = useAccountPoolAssetBalances(
    connectedAddress,
    pool,
  );

  const allBalances: PoolBalances | undefined = useMemo(() => {
    if (
      pool?.weights &&
      userBaseBalance &&
      userAssetBalances &&
      poolAssetBalances &&
      userAssetBalances?.length !== 0 &&
      poolAssetBalances?.length !== 0 &&
      poolBaseBalance
    ) {
      const allBalances: PoolBalances = pool.weights.reduce(
        (balances, weight, index) => {
          const isBaseAsset = index === pool.weights.length - 1;

          const userBalance = isBaseAsset
            ? userBaseBalance
            : new Decimal(
                userAssetBalances == null
                  ? 0
                  : userAssetBalances[index].free.toString(),
              );
          const poolBalance = isBaseAsset
            ? new Decimal(poolBaseBalance.toString())
            : new Decimal(
                poolAssetBalances == null
                  ? 0
                  : poolAssetBalances[index].free.toString(),
              );

          const id = assetObjStringToId(weight!.assetId);

          balances[id] = {
            pool: poolBalance,
            user: userBalance,
          };
          return balances;
        },
        {} as PoolBalances,
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
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white">
        <Tab.Group>
          <Tab.List className="flex h-[71px] text-center text-ztg-18-150 font-medium">
            <Tab className="w-1/2 rounded-tl-[10px] bg-anti-flash-white transition-all ui-selected:bg-white ui-selected:font-bold">
              Join
            </Tab>
            <Tab className="w-1/2 rounded-tr-[10px] bg-anti-flash-white transition-all ui-selected:bg-white ui-selected:font-bold">
              Exit
            </Tab>
          </Tab.List>

          <Tab.Panels className="p-[30px]">
            <Tab.Panel>
              {allBalances && (
                <JoinPoolForm
                  poolId={poolId}
                  poolBalances={allBalances}
                  totalPoolShares={
                    new Decimal(totalPoolIssuance?.toString() ?? 0)
                  }
                  baseAssetTicker={metadata?.symbol}
                  onSuccess={onClose}
                />
              )}
            </Tab.Panel>
            <Tab.Panel>
              {allBalances && (
                <ExitPoolForm
                  poolId={poolId}
                  poolBalances={allBalances}
                  totalPoolShares={
                    new Decimal(totalPoolIssuance?.toString() ?? 0)
                  }
                  userPoolShares={new Decimal(userPoolTokens?.toString() ?? 0)}
                  baseAssetTicker={metadata?.symbol}
                  onSuccess={onClose}
                />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Dialog.Panel>
    </Modal>
  );
};

export default LiquidityModal;
