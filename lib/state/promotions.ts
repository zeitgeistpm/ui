import { useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";

export type MarketPromotions = {
  /**
   * A map of market IDs to whether or not the promotion modal is open.
   */
  modals: {
    [marketId: number]: boolean;
  };
};

/**
 * Atom for holding the state of the market promotion modals that are opened.
 * This is persisted in local storage so that the user's preference is remembered when a promotion modal is closed.
 */
const marketPromotionsAtom = persistentAtom<MarketPromotions>({
  key: "market-promotions",
  defaultValue: {
    modals: {},
  },
});

export type UseMarketPromotionState = {
  /**
   * Whether or not the promotion modal is open.
   */
  open: boolean;
  /**
   * Toggles the promotion modal open or closed.
   */
  toggle: (open?: boolean) => void;
};

/**
 * Hook for interacting with the state of the market promotion modals.
 *
 * @param marketId - the market id to get the modal state for
 * @param opts.defaultOpenedState - the default state of the modal if it has not been interacted with by the user before.
 * @returns UseMarketPromotionState
 */
export const useMarketPromotionState = (
  marketId: number,
  opts?: { defaultOpenedState: boolean },
): UseMarketPromotionState => {
  const [marketPromotions, setMarketPromotions] = useAtom(marketPromotionsAtom);

  const toggle = (open?: boolean) => {
    setMarketPromotions((marketPromotions) => ({
      ...marketPromotions,
      modals: {
        ...marketPromotions.modals,
        [marketId]:
          typeof open !== "undefined"
            ? open
            : !marketPromotions.modals[marketId],
      },
    }));
  };

  const open =
    marketPromotions.modals[marketId] ?? opts?.defaultOpenedState ?? false;

  return {
    open,
    toggle,
  };
};
