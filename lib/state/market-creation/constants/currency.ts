import { SupportedCurrencyTag } from "lib/constants/supported-currencies";

/**
 * A map of the minimum liquidity required for a market creation
 * pr supported currency.
 */

export const minBaseLiquidity: Record<
  Exclude<SupportedCurrencyTag, "ZBS">,
  number
> = {
  ZTG: 200,
  DOT: 10,
};
