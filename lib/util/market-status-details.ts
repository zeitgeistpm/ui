import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { MarketStatus } from "@zeitgeistpm/sdk-next";
import { MarketDispute, MarketTypeOf } from "@zeitgeistpm/sdk/dist/types";
import { formatScalarOutcome } from "./format-scalar-outcome";
import {
  MarketReport,
  isMarketCategoricalOutcome,
  isMarketScalarOutcome,
} from "lib/types";

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
    //scalar market
    if (isMarketScalarOutcome(dispute.outcome)) {
      return {
        outcome: formatScalarOutcome(dispute.outcome.scalar, scalarType),
        by: dispute.by,
      };
      //categorical market
    } else if (isMarketCategoricalOutcome(dispute.outcome)) {
      return {
        outcome: categories[Number(dispute.outcome.categorical)].name,
        by: dispute.by,
      };
    } else {
      return {};
    }
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
