import { defaultTags } from "../constants/markets";

export type MarketOutcome = {
  name: string;
  ticker: string;
  color: string;
  price: number;
  assetId?: string;
  amountInPool?: string;
};
export type MarketOutcomes = MarketOutcome[];

export enum EMarketStatus {
  Proposed = "Proposed",
  Active = "Active",
  Closed = "Closed",
  Reported = "Reported",
  Disputed = "Disputed",
  Resolved = "Resolved",
}

export type MarketStatus = keyof typeof EMarketStatus;
