import { gql, GraphQLClient } from "graphql-request";
import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";

const historicalMarketQuery = gql`
  query HistoricalMarkets($marketId: Int) {
    historicalMarkets(where: { marketId_eq: $marketId }) {
      by
      blockNumber
      event
      outcome {
        categorical
        scalar
      }
      resolvedOutcome
      timestamp
    }
  }
`;

export type MarketEventStatus =
  | "MarketCreated"
  | "MarketClosed"
  | "MarketDisputed"
  | "MarketResolved"
  | "MarketReported";

export type MarketEvent = {
  blockNumber: number;
  by: string;
  event: MarketEventStatus;
  outcome: OutcomeReport;
  resolvedOutcome: string;
  timestamp: number;
};

export const getMarketHistory = async (
  client: GraphQLClient,
  marketId: number,
): Promise<MarketEvent[]> => {
  const response = await client.request<{
    historicalMarkets: MarketEvent[];
  }>(historicalMarketQuery, { marketId });
  return response.historicalMarkets;
};
