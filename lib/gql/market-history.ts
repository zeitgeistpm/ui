import { gql, GraphQLClient } from "graphql-request";
import { MarketStatus } from "@zeitgeistpm/sdk-next";
import { OutcomeReport } from "@zeitgeistpm/sdk/dist/types";

const historicalMarketQuery = gql`
  query HistoricalMarkets($marketId: Int) {
    historicalMarkets(where: { marketId_eq: $marketId }) {
      by
      blockNumber
      event
      id
      outcome {
        categorical
        scalar
      }
      resolvedOutcome
      status
      timestamp
    }
  }
`;

export type MarketHistory = {
  by: string;
  blockNumber: number;
  event: string;
  id: number;
  outcome: OutcomeReport;
  resolvedOutcome: string;
  status: MarketStatus;
  timestamp: string;
};

export const getMarketHistory = async (
  client: GraphQLClient,
  marketId: number,
): Promise<MarketHistory[]> => {
  if (!marketId) return [];
  const response = await client.request<{
    historicalMarkets: MarketHistory[];
  }>(historicalMarketQuery, { marketId });
  return response.historicalMarkets;
};
