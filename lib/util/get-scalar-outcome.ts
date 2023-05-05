import { Decimal } from "decimal.js";
import { ZTG } from "../constants";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";

export const getScalarOutcome = (
  outcome: string,
  scalarType: ScalarRangeType,
) => {
  const inferedType: ScalarRangeType = scalarType ?? "number";
  return inferedType === "number"
    ? new Decimal(outcome).div(ZTG).toNumber()
    : new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
      }).format(new Decimal(outcome).div(ZTG).toNumber());
};
