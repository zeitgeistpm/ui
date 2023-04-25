import { ZTG } from "lib/constants";
import Decimal from "decimal.js";
import type { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { MarketStage, MarketStatus } from "@zeitgeistpm/sdk-next";
import moment from "moment";

export const getScalarOutcome = (
  outcome: string,
  scalarType: ScalarRangeType,
) => {
  const dateFormat = "MM.DD.YYYY";
  const inferedType: ScalarRangeType = scalarType ?? "number";
  return inferedType === "number"
    ? new Decimal(outcome).div(ZTG).toNumber()
    : new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
      }).format(new Decimal(outcome).div(ZTG).toNumber());
};

export const getMarketStatusDetails = (
  marketType: { categorical?: string; scalar?: string[] },
  categories: { name: string }[],
  status: string,
  disputes: {
    at: number;
    by: string;
    outcome: { categorical?: number; scalar?: string };
  }[],
  report: { outcome: { categorical?: number; scalar?: string }; by: string },
  resolvedOutcome: string,
  scalarType: ScalarRangeType,
): { outcome: string | number; by: string } => {
  const lastIndex = disputes?.length - 1;

  if (status === "Disputed") {
    //scalar market
    if (marketType?.scalar !== null) {
      return {
        outcome: getScalarOutcome(
          disputes[lastIndex].outcome?.scalar,
          scalarType,
        ),
        by: disputes[lastIndex].by,
      };
      //categorical market
    } else {
      return {
        outcome: categories[disputes[lastIndex].outcome?.categorical].name,
        by: disputes[lastIndex].by,
      };
    }
  } else if (status === "Reported") {
    //scalar market
    if (marketType?.scalar !== null) {
      return {
        outcome: getScalarOutcome(report.outcome?.scalar, scalarType),
        by: report.by,
      };
      //categorical market
    } else {
      return {
        outcome: categories[report.outcome?.categorical].name,
        by: report?.by,
      };
    }
  } else if (status === "Resolved") {
    //scalar market
    if (marketType?.scalar !== null) {
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
