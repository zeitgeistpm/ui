import { ZTG } from "lib/constants";
import Decimal from "decimal.js";

export const getMarketStatusDetails = (market) => {
  if (market.status === "Disputed") {
    //scalar market
    if (market.marketType?.scalar !== null) {
      return {
        outcome: new Decimal(
          market.disputes[market.disputes.length - 1].outcome?.scalar,
        )
          .div(ZTG)
          .toNumber(),
        by: market.disputes[market.disputes.length - 1].by,
      };
      //categorical market
    } else {
      return {
        outcome:
          market.categories[
            market.disputes[market.disputes.length - 1].outcome?.categorical
          ].name,
        by: market.disputes[market.disputes.length - 1].by,
      };
    }
  } else if (market.status === "Reported") {
    //scalar market
    if (market.marketType?.scalar !== null) {
      return {
        outcome: new Decimal(market.report.outcome?.scalar).div(ZTG).toNumber(),
        by: market.report.by,
      };
      //categorical market
    } else {
      return {
        outcome: market.categories[market.report.outcome?.categorical].name,
        by: market.report?.by,
      };
    }
  } else if (market.status === "Resolved") {
    //scalar market
    if (market.marketType?.scalar !== null) {
      return {
        outcome: new Decimal(market.resolvedOutcome).div(ZTG).toNumber(),
        by: null,
      };
      //categorical market
    } else {
      return {
        outcome: market.categories[market.resolvedOutcome].name,
        by: null,
      };
    }
  } else return { outcome: null, by: null };
};
