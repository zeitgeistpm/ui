import type { MarketId, ScalarRangeType } from "@zeitgeistpm/sdk";
import { MarketStatus } from "@zeitgeistpm/sdk";
import { formatScalarOutcome } from "./format-scalar-outcome";
import { MarketReport, isMarketScalarOutcome } from "lib/types";
import { MarketDispute, MarketTypeOf } from "lib/types/markets";
import { findAsset } from "./assets";

export const getMarketStatusDetails = (
  marketType: MarketTypeOf,
  assets: { name: string; assetId: string }[],
  status: MarketStatus,
  scalarType: ScalarRangeType,
  marketId: MarketId,
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
        outcome:
          findAsset(
            {
              CategoricalOutcome: [marketId, report.outcome.categorical],
            },
            assets,
          )?.name ?? "",
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
        outcome:
          findAsset(
            {
              CategoricalOutcome: [marketId, Number(resolvedOutcome)],
            },
            assets,
          )?.name ?? "",
      };
    }
  } else return {};
};
