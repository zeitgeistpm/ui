import { atomWithStorage } from "jotai/utils";

/**
 * Atom storage for tradeslip slippage percentage.
 * @persistent - local
 */
export const slippagePercentageAtom = atomWithStorage<number>(
  "trade-slip-slippage-percentage",
  1,
);
