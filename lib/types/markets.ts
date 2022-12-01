export type MarketOutcome = {
  name: string;
  ticker: string;
  color: string;
  price: number;
  assetId?: string;
  amountInPool?: string;
};
export type MarketOutcomes = MarketOutcome[];
