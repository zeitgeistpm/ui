import { PoolGetQuery } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useMemo } from "react";
import { useMarketOutcomes } from "./useMarketOutcomes";

export const useOutcomePrices = (
  getPoolQuery: PoolGetQuery,
  refetchInterval?: number,
) => {
  const outcomes = useMarketOutcomes(getPoolQuery, refetchInterval);

  const prices = useMemo<
    { [key: string]: string | Decimal } | undefined
  >(() => {
    if (outcomes == null) {
      return;
    }
    return outcomes.reduce(
      (prev, outcome) => ({
        ...prev,
        [JSON.stringify(outcome.assetId)]: outcome.price,
      }),
      {},
    );
  }, [outcomes]);

  return prices;
};
