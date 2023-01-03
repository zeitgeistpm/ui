import dynamic from "next/dynamic";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import { NextPage } from "next";

import MarketsList from "components/markets/MarketsList";
import { GraphQLClient } from "graphql-request";
import { IndexedMarketCardData } from "components/markets/market-card";
import MarketScroll from "components/markets/MarketScroll";
import getNewestMarkets from "lib/gql/newest-markets";

export async function getStaticProps() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  const newestMarkets = await getNewestMarkets(client);

  return {
    props: {
      newestMarkets: newestMarkets ?? [],
    },
    revalidate: 1 * 60, //1min
  };
}

const DynamicMarketList = dynamic(() => Promise.resolve(MarketsList), {
  ssr: false,
});
const MarketsPage: NextPage<{
  newestMarkets: IndexedMarketCardData[];
}> = observer(({ newestMarkets }) => {
  return (
    <>
      {newestMarkets?.length > 0 && (
        <div className="mt-[30px]">
          <MarketScroll title="Newest Markets" markets={newestMarkets} />
        </div>
      )}
      <DynamicMarketList />
    </>
  );
});

export default MarketsPage;
