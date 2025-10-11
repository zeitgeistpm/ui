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

  const { data: pool } = useAmm2Pool(
    poolId ? 0 : marketId,
    poolId ?? null,
    virtualMarket,
  );

  const baseAsset = pool?.baseAsset
    ? parseAssetId(pool.baseAsset).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAsset);

  return (
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className="w-full max-w-[564px] overflow-hidden rounded-xl border border-sky-200/30 bg-white/95 shadow-2xl backdrop-blur-lg">
        <Tab.Group>
          <Tab.List className="flex h-[71px] border-b border-sky-200/30 text-center text-lg font-semibold">
            <Tab className="w-1/2 border-r border-sky-200/30 bg-sky-50/50 text-sky-700 transition-all hover:bg-white/80 ui-selected:bg-white/95 ui-selected:text-sky-900 ui-selected:shadow-sm">
              Join Pool
            </Tab>
            <Tab className="w-1/2 bg-sky-50/50 text-sky-700 transition-all hover:bg-white/80 ui-selected:bg-white/95 ui-selected:text-sky-900 ui-selected:shadow-sm">
              Exit Pool
            </Tab>
          </Tab.List>

          <Tab.Panels className="p-8">
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
