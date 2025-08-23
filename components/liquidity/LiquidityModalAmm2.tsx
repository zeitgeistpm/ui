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
}: {
  open: boolean;
  onClose: () => void;
  marketId: number;
}) => {
  const wallet = useWallet();

  const { data: pool } = useAmm2Pool(marketId, null);
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
