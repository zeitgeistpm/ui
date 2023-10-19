import { OutcomeReport } from "@zeitgeistpm/indexer";

export type MarketOutcome = {
  name: string;
  color?: string;
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

export type MarketDispute = {
  at: number;
  by: string;
};

export type MarketTypeOf =
  | {
      categorical: number;
    }
  | {
      scalar: string[];
    };
