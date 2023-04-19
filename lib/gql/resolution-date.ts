import { gql, GraphQLClient } from "graphql-request";

const resolutionQuery = gql`
  query MarketResolutionDate($marketId: Int) {
    historicalMarkets(
      where: { event_contains: "Resolved", marketId_eq: $marketId }
    ) {
      timestamp
    }
  }
`;

//returns ISO string timestamp
export const getResolutionTimestamp = async (
  client: GraphQLClient,
  marketId: number,
) => {
  const response = await client.request<{
    historicalMarkets: { timestamp: string }[];
  }>(resolutionQuery, {
    marketId,
  });

  return response.historicalMarkets?.length > 0
    ? response.historicalMarkets[0].timestamp
    : null;
};
