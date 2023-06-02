import { Decimal } from "decimal.js";
import { ZTG } from "../constants";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { formatNumberCompact } from "./format-compact";

export const getScalarOutcome = (
  outcome: string | number,
  scalarType: ScalarRangeType,
) => {
  const inferedType: ScalarRangeType = scalarType ?? "number";
  return inferedType === "number"
    ? formatNumberCompact(
        typeof outcome === "string"
          ? new Decimal(outcome).div(ZTG).toNumber()
          : outcome,
      )
    : new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
      }).format(new Decimal(outcome).div(ZTG).toNumber());
};
