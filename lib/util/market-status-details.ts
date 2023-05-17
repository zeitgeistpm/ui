import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { MarketStatus } from "@zeitgeistpm/sdk-next";
import {
  MarketDispute,
  MarketTypeOf,
  Report,
} from "@zeitgeistpm/sdk/dist/types";
import { formatScalarOutcome } from "./format-scalar-outcome";

export const getMarketStatusDetails = (
  marketType: MarketTypeOf,
  categories: { name: string }[],
  status: MarketStatus,
  disputes: MarketDispute,
  report: Report,
  resolvedOutcome: string,
  scalarType: ScalarRangeType,
): { outcome: string | number; by: string } => {
  if (status === "Disputed" && disputes) {
    //scalar market
    if (marketType?.["scalar"] !== null) {
      return {
        outcome: formatScalarOutcome(disputes.outcome?.["scalar"], scalarType),
        by: disputes?.by,
      };
      //categorical market
    } else {
      return {
        outcome: categories[Number(disputes?.outcome?.["categorical"])].name,
        by: disputes.by,
      };
    }
  } else if (status === "Reported" && report) {
    //scalar market
    if (marketType?.["scalar"] !== null) {
      return {
        outcome: formatScalarOutcome(report.outcome?.["scalar"], scalarType),
        by: report?.by,
      };
      //categorical market
    } else {
      return {
        outcome: categories[report.outcome?.["categorical"]].name,
        by: report?.by,
      };
    }
  } else if (status === "Resolved" && resolvedOutcome) {
    //scalar market
    if (marketType?.["scalar"] !== null) {
      return {
        outcome: formatScalarOutcome(resolvedOutcome, scalarType),
        by: null,
      };
      //categorical market
    } else {
      return {
        outcome: categories[resolvedOutcome].name,
        by: null,
      };
    }
  } else return { outcome: null, by: null };
};
