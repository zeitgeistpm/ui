import { NextPage } from "next";

import { IndexedMarketCardData } from "components/markets/market-card/index";
import MarketScroll from "components/markets/MarketScroll";
import MarketsList from "components/markets/MarketsList";
import { GraphQLClient } from "graphql-request";
import { graphQlEndpoint } from "lib/constants";
import getNewestMarkets from "lib/gql/newest-markets";

export async function getStaticProps() {
  const client = new GraphQLClient(graphQlEndpoint);
  const newestMarkets = await getNewestMarkets(client);

  return {
    props: {
      newestMarkets: newestMarkets ?? [],
    },
    revalidate: 1 * 60, //1min
  };
}

const MarketsPage: NextPage<{
  newestMarkets: IndexedMarketCardData[];
}> = ({ newestMarkets }) => {
  return (
    <>
      {newestMarkets?.length > 0 && (
        <MarketScroll title="Newest Markets" markets={newestMarkets} />
      )}
      <MarketsList />
    </>
  );
};

export default MarketsPage;
