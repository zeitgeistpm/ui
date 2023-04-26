import { ZTG } from "lib/constants";
import Decimal from "decimal.js";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { MarketStatus } from "@zeitgeistpm/sdk-next";
import { MarketDispute, MarketTypeOf } from "@zeitgeistpm/sdk/dist/types";
import { MarketReport } from "@zeitgeistpm/indexer/src/graphql/sdk";

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

export const getMarketStatusDetails = (
  marketType: MarketTypeOf,
  categories: { name: string }[],
  status: MarketStatus,
  disputes: MarketDispute,
  report: MarketReport,
  resolvedOutcome: string,
  scalarType: ScalarRangeType,
): { outcome: string | number; by: string } => {
  if (status === "Disputed" && disputes) {
    //scalar market
    if (marketType?.["scalar"] !== null) {
      return {
        outcome: getScalarOutcome(disputes.outcome?.["scalar"], scalarType),
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
        outcome: getScalarOutcome(report.outcome?.["scalar"], scalarType),
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
        outcome: getScalarOutcome(resolvedOutcome, scalarType),
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
