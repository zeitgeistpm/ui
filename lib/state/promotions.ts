import { useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";

export type MarketPromotions = {
  modals: {
    [marketId: number]: boolean;
  };
};
/**
 * FIX
 */
const marketPromotionsAtom = persistentAtom<MarketPromotions>({
  key: "market-promotions",
  defaultValue: {
    modals: {},
  },
});

export const useMarketPromotionState = (
  marketId: number,
  opts?: { defaultOpenedState: boolean },
) => {
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
