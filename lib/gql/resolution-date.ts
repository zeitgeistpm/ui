import { gql, GraphQLClient } from "graphql-request";

const resolutionQuery = gql`
  query MarketResolutionDate($marketId: Int) {
    historicalMarkets(
      where: { event_eq: MarketResolved, market: { marketId_eq: $marketId } }
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

  return {
    timestamp:
      response.historicalMarkets?.length > 0
        ? response.historicalMarkets[0].timestamp
        : null,
    blockNumber:
      response.historicalMarkets?.length > 0
        ? response.historicalMarkets[0].blockNumber
        : null,
  };
};
