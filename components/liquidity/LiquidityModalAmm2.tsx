import { Tab } from "@headlessui/react";
import {
  IOMarketOutcomeAssetId,
  getIndexOf,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Modal from "components/ui/Modal";
import { ModalPanel, ModalTabs, ModalBody } from "components/ui/ModalPanel";
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
      <ModalPanel size="xl" className="flex flex-col">
        {/* Added min-w-0 to Tab.Group to ensure width constraints propagate */}
        <Tab.Group as="div" className="flex flex-col h-full min-w-0 w-full">
          {/* Standardized tab header */}
          <ModalTabs
            tabs={
              <Tab.List className="flex h-full">
                <Tab className="flex-1 px-3 py-2 text-sm font-medium transition-all border-r border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 ui-selected:bg-white/10 ui-selected:text-white/90 ui-selected:font-semibold">
                  Join Pool
                </Tab>
                <Tab className="flex-1 px-3 py-2 text-sm font-medium transition-all bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90 ui-selected:bg-white/10 ui-selected:text-white/90 ui-selected:font-semibold">
                  Exit Pool
                </Tab>
              </Tab.List>
            }
          />

          {/* Standardized scrollable content */}
          {/* Added min-w-0 and w-full to prevent tab switching from resizing modal */}
          <Tab.Panels className="flex-1 min-w-0 w-full overflow-hidden">
            <Tab.Panel className="h-full min-w-0 w-full">
              <ModalBody>
                {pool && (
                  <JoinPoolFormAmm2
                    marketId={marketId}
                    pool={pool}
                    baseAssetTicker={metadata?.symbol}
                    onSuccess={onClose}
                    virtualMarket={virtualMarket}
                  />
                )}
              </ModalBody>
            </Tab.Panel>
            <Tab.Panel className="h-full min-w-0 w-full">
              <ModalBody>
                {pool && (
                  <ExitPoolFormAmm2
                    marketId={marketId}
                    pool={pool}
                    baseAssetTicker={metadata?.symbol}
                    onSuccess={onClose}
                    virtualMarket={virtualMarket}
                  />
                )}
              </ModalBody>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </ModalPanel>
    </Modal>
  );
};

export default LiquidityModalAmm2;
