import { gql, GraphQLClient } from "graphql-request";

const resolutionQuery = gql`
  query MarketResolutionDate($marketId: Int) {
    historicalMarkets(
      where: { event_eq: MarketResolved, marketId_eq: $marketId }
    ) {
      timestamp
      blockNumber
    }
  }
`;

//returns ISO string timestamp
export const getResolutionTimestamp = async (
  client: GraphQLClient,
  marketId: number,
) => {
  const response = await client.request<{
    historicalMarkets: { timestamp: string; blockNumber: number }[];
  }>(resolutionQuery, {
    marketId,
  });

  return response.historicalMarkets?.length > 0
    ? {
        timestamp: response.historicalMarkets[0].timestamp,
        blockNumber: response.historicalMarkets[0].blockNumber,
      }
    : null;
};
