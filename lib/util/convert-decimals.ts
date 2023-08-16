import Decimal from "decimal.js";

export const convertDecimals = (
  amount: Decimal,
  fromDecimals: number,
  toDecimals: number,
) => {
  const multiplier = new Decimal(10).pow(toDecimals - fromDecimals);

  return amount.mul(multiplier);
};
