import { Dialog, Tab } from "@headlessui/react";
import {
  IOMarketOutcomeAssetId,
  getIndexOf,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useWallet } from "lib/state/wallet";
import ExitPoolFormAmm2 from "./ExitPoolFormAmm2";
import JoinPoolFormAmm2 from "./JoinPoolFormAmm2";

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

const LiquidityModalAmm2 = ({
  open,
  onClose,
  marketId,
  poolId,
  virtualMarket,
}: {
  open: boolean;
  onClose: () => void;
  marketId: number;
  poolId?: number;
  virtualMarket?: any;
}) => {
  const wallet = useWallet();

  console.log("[LiquidityModalAmm2] Props:", {
    marketId,
    poolId,
    hasVirtualMarket: !!virtualMarket,
    virtualMarketId: virtualMarket?.marketId,
    virtualMarketCategories: virtualMarket?.categories?.length
  });

  const { data: pool } = useAmm2Pool(poolId ? 0 : marketId, poolId ?? null, virtualMarket);

  console.log("[LiquidityModalAmm2] Pool data:", {
    hasPool: !!pool,
    poolId: pool?.poolId,
    assetIdsCount: pool?.assetIds?.length,
    assetIds: pool?.assetIds,
    reservesSize: pool?.reserves?.size,
    reserves: pool?.reserves ? Array.from(pool.reserves.entries()) : null
  });

  const baseAsset = pool?.baseAsset
    ? parseAssetId(pool.baseAsset).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAsset);

  return (
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className="w-full max-w-[564px] rounded-[10px] bg-white">
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
              {pool && (
                <JoinPoolFormAmm2
                  marketId={marketId}
                  pool={pool}
                  baseAssetTicker={metadata?.symbol}
                  onSuccess={onClose}
                  virtualMarket={virtualMarket}
                />
              )}
            </Tab.Panel>
            <Tab.Panel>
              {pool && (
                <ExitPoolFormAmm2
                  marketId={marketId}
                  pool={pool}
                  baseAssetTicker={metadata?.symbol}
                  onSuccess={onClose}
                  virtualMarket={virtualMarket}
                />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Dialog.Panel>
    </Modal>
  );
};

export default LiquidityModalAmm2;
