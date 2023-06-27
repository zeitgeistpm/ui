import Decimal from "decimal.js";

export const calculateFreeBalance = (
  free: string,
  miscFrozen: string,
  feeFrozen: string,
) => {
  const maxFrozen = Decimal.max(miscFrozen, feeFrozen);
  return new Decimal(free).minus(maxFrozen);
};
