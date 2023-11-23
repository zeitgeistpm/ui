import Decimal from "decimal.js";

export const ONE_BILLION = 10 ** 9;

export function perbillToNumber(perbill: number): number;
export function perbillToNumber(perbill: Decimal): Decimal;
export function perbillToNumber(perbill: Decimal | number): Decimal | number {
  if (typeof perbill === "number") {
    return perbill / ONE_BILLION;
  } else {
    return perbill.div(ONE_BILLION);
  }
}

export function perbillToPrct(perbill: number): number;
export function perbillToPrct(perbill: Decimal): Decimal;
export function perbillToPrct(perbill: Decimal | number): Decimal | number {
  if (typeof perbill === "number") {
    return perbillToNumber(perbill) * 100;
  } else {
    return perbillToNumber(perbill).mul(100);
  }
}
