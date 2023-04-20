import { ZTG } from "lib/constants";
import Decimal from "decimal.js";

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
): { outcome: string | number; by: string } => {
  const lastIndex = disputes?.length - 1;
  if (status === "Disputed") {
    //scalar market
    if (marketType?.scalar !== null) {
      return {
        outcome: new Decimal(disputes[lastIndex].outcome?.scalar)
          .div(ZTG)
          .toNumber(),
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
        outcome: new Decimal(report.outcome?.scalar).div(ZTG).toNumber(),
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
        outcome: new Decimal(resolvedOutcome).div(ZTG).toNumber(),
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
