import { IndexedMarket, Context } from "@zeitgeistpm/sdk-next";
import { createContext, useContext } from "react";

type MarketOutcomes = {
  [marketId: number]: {
    color: string;
    name: string;
    price: number;
    assetId: string;
    amountInPool: string;
  }[];
};

const MarketsListContext = createContext<{
  outcomes: MarketOutcomes;
}>(null);

export const useMarketOutcomes = (marketId: number) => {
  const context = useContext(MarketsListContext);
  return context?.outcomes[marketId];
};

export default MarketsListContext;
