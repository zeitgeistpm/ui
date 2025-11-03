import { Tab } from "@headlessui/react";
import {
  IOMarketOutcomeAssetId,
  getIndexOf,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Modal from "components/ui/Modal";
import { ModalPanel } from "components/ui/ModalPanel";
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
      <ModalPanel maxWidth="md" className="overflow-hidden">
        <Tab.Group>
          <Tab.List className="flex h-12 border-b-2 border-white/10 text-center text-sm font-semibold">
            <Tab className="w-1/2 border-r-2 border-white/10 bg-white/5 text-white/80 transition-all hover:bg-white/10 hover:text-white ui-selected:bg-white/10 ui-selected:font-bold ui-selected:text-white ui-selected:shadow-sm ui-selected:backdrop-blur-sm">
              Join Pool
            </Tab>
            <Tab className="w-1/2 bg-white/5 text-white/80 transition-all hover:bg-white/10 hover:text-white ui-selected:bg-white/10 ui-selected:font-bold ui-selected:text-white ui-selected:shadow-sm ui-selected:backdrop-blur-sm">
              Exit Pool
            </Tab>
          </Tab.List>

          <Tab.Panels className="p-5">
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
      </ModalPanel>
    </Modal>
  );
};

export default LiquidityModalAmm2;
