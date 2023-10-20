import type { ScalarRangeType } from "@zeitgeistpm/sdk";
import { MarketStatus } from "@zeitgeistpm/sdk";
import { formatScalarOutcome } from "./format-scalar-outcome";
import {
  MarketReport,
  isMarketCategoricalOutcome,
  isMarketScalarOutcome,
} from "lib/types";
import { MarketDispute, MarketTypeOf } from "lib/types/markets";

export const getMarketStatusDetails = (
  marketType: MarketTypeOf,
  categories: { name: string }[],
  status: MarketStatus,
  scalarType: ScalarRangeType,
  dispute?: MarketDispute,
  report?: MarketReport,
  resolvedOutcome?: string,
): { outcome?: string | number; by?: string } => {
  if (status === "Disputed" && dispute) {
    return {
      by: dispute.by,
    };
  } else if (status === "Reported" && report) {
    //scalar market
    if (isMarketScalarOutcome(report.outcome)) {
      return {
        outcome: formatScalarOutcome(report.outcome.scalar, scalarType),
        by: report.by,
      };
      //categorical market
    } else {
      return {
        outcome: categories[report.outcome.categorical].name,
        by: report.by,
      };
    }
  } else if (status === "Resolved" && resolvedOutcome) {
    //scalar market
    if (marketType?.["scalar"] !== null) {
      return {
        outcome: formatScalarOutcome(resolvedOutcome, scalarType),
      };
      //categorical market
    } else {
      return {
        outcome: categories[resolvedOutcome].name,
      };
    }
  } else return {};
};
