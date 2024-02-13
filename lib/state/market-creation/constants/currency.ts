import { SupportedCurrencyTag } from "lib/constants/supported-currencies";

/**
 * A map of the minimum liquidity required for a market creation
 * pr supported currency.
 */

export const minBaseLiquidity: Record<SupportedCurrencyTag, number> = {
  ZTG: 200,
  DOT: 10,
  NTT: 100,
  USDC: 50,
};
