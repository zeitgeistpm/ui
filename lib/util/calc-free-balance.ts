import Decimal from "decimal.js";

export const calculateFreeBalance = (
  free: string,
  miscFrozen: string,
  feeFrozen: string,
) => {
  //   const maxFrozen = new Decimal(miscFrozen).greaterThan(feeFrozen)
  //     ? new Decimal(miscFrozen)
  //     : new Decimal(feeFrozen);
  const maxFrozen = Decimal.max(miscFrozen, feeFrozen);
  return new Decimal(free).minus(maxFrozen);
};
