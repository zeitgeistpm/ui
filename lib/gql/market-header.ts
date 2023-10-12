import { gql } from "graphql-request";
import { marketMetaFilter } from "./constants";
import { IndexerContext, Sdk } from "@zeitgeistpm/sdk";

const marketHeaderQuery = gql`
  query MarketTransactionHeader($marketIds: [Int!]) {
    markets(
      where: {
        marketId_in: $marketIds
        ${marketMetaFilter}
      }
      orderBy: marketId_ASC
    ) {
      marketId
      question
      categories {
        name
      }
    }
  }
`;

export type MarketHeader = {
  marketId: number;
  question: string;
  categories: { name: string }[];
};

export const getMarketHeaders = async (
  sdk: Sdk<IndexerContext>,
  marketIds: number[],
) => {
  const { markets } = await sdk.indexer.client.request<{
    markets: MarketHeader[];
  }>(marketHeaderQuery, {
    marketIds: marketIds,
  });

  return markets;
};
