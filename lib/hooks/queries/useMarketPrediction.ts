import { PoolGetQuery } from "@zeitgeistpm/sdk-next";
import { useMemo } from "react";
import { useMarketOutcomes } from "./useMarketOutcomes";

export const useMarketPrediction = (
  getPoolQuery: PoolGetQuery,
  refetchInterval?: number,
) => {
  const outcomes = useMarketOutcomes(getPoolQuery, refetchInterval);

  if (outcomes == null) {
    return;
  }
  const predictedObj = outcomes
    .sort((a, b) => (a.price.greaterThan(b.price) ? 1 : 0))
    .at(0);

  return predictedObj.category.name;
};
