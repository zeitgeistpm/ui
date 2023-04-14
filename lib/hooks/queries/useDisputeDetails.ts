import { gql, GraphQLClient } from "graphql-request";

const disputeDetailsQuery = gql`
  query Market($marketId: Int) {
    markets(where: { disputes_isNull: false, marketId_eq: $marketId }) {
      id
      disputes {
        by
        at
        outcome {
          categorical
          scalar
        }
      }
      marketId
    }
  }
`;

type DisputeDetails = {
  id: number;
  disputes: {
    by: string;
    at: string;
    outcome: {
      categorical: number;
      scalar: number;
    };
  };
  marketId: number;
};

export const useDisputeDetails = async (
  client: GraphQLClient,
  marketId: number | string,
): Promise<DisputeDetails> => {
  const response = await client.request<{ disputedMarket: DisputeDetails }>(
    disputeDetailsQuery,
    { marketId },
  );
  return response.disputedMarket;
};
