import { Decimal } from "decimal.js";
import { ZTG } from "../constants";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { formatNumberCompact } from "./format-compact";

export const formatScalarOutcome = (
  outcome: string | number,
  scalarType: ScalarRangeType,
) => {
  return scalarType === "date"
    ? new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
      }).format(new Decimal(outcome).div(ZTG).toNumber())
    : new Intl.NumberFormat("default", {
        maximumSignificantDigits: 3,
        notation: "compact",
      }).format(
        typeof outcome === "string"
          ? new Decimal(outcome).div(ZTG).toNumber()
          : outcome,
      );
};
