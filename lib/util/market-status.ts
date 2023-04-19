export const getMarketStatusDetails = (market) => {
  if (market.status === "Disputed") {
    if (market.marketType?.scalar !== null) {
      return {
        outcome: market.disputes[market.disputes.length - 1].outcome?.scalar,
        by: market.disputes[market.disputes.length - 1].by,
      };
    } else {
      return {
        outcome:
          market.categories[
            market.disputes[market.disputes.length - 1].outcome?.categorical
          ].name,
        by: market.disputes[market.disputes.length - 1].by,
      };
    }
  }
  if (market.status === "Reported") {
    if (market.marketType?.scalar !== null) {
      return {
        outcome: market?.report?.outcome?.scalar,
        by: market?.report?.by,
      };
    } else {
      return {
        outcome: market.categories[report?.outcome?.categorical].name,
        by: market?.report?.by,
      };
    }
  }
  if (market.status === "Resolved") {
    if (market.marketType?.scalar !== null) {
      return {
        outcome: market?.resolvedOutcome,
      };
    } else {
      return {
        outcome: market.categories[market.resolvedOutcome].name,
      };
    }
  }
};
