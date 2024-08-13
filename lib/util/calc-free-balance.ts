import Decimal from "decimal.js";

export const calculateFreeBalance = (
  free: string,
  miscFrozen: string,
  feeFrozen: string,
) => {
  const maxFrozen = Decimal.max(
    miscFrozen ? miscFrozen : 0,
    feeFrozen ? feeFrozen : 0,
  );
  return new Decimal(free).minus(maxFrozen);
};
