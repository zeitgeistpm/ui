import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { FullContext, Sdk } from "@zeitgeistpm/sdk";
import { GraphQLClient } from "graphql-request";
import { getCmsFeaturedMarkets } from "lib/cms/featured-markets";

const getFeaturedMarkets = async (
  client: GraphQLClient,
  sdk: Sdk<FullContext>,
): Promise<FullMarketFragment[]> => {
  const cmsFeaturedMarkets = await getCmsFeaturedMarkets();

  const { markets } = await sdk.indexer.markets({
    where: {
      marketId_in: cmsFeaturedMarkets.marketIds ?? [],
    },
  });

  markets.sort((a, b) => {
    return (
      cmsFeaturedMarkets.marketIds?.findIndex((m) => m === a.marketId) -
      cmsFeaturedMarkets.marketIds?.findIndex((m) => m === b.marketId)
    );
  });

  return markets;
};

export default getFeaturedMarkets;
