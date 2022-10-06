import { GraphQLClient } from "graphql-request";
import { getMarket, getMarketIds } from "lib/gql/markets";
import { NextPage } from "next";

export async function getStaticPaths() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  const marketIds = await getMarketIds(client);
  const paths = marketIds.map((marketId) => ({
    params: { id: marketId.toString() },
  }));
  // const paths = [
  //   {
  //     params: { id: "161" },
  //   },
  // ];
  console.log(paths);

  // return { paths, fallback: "blocking" };
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  console.log("current:", params.id);

  const market = await getMarket(client, params.id);
  console.log(market);

  return {
    props: {
      indexedMarket: market,
      // indexedMarket: {},
    },
    // revalidate: 10 * 60, //10minx
  };
}

const Market: NextPage<{ indexedMarket: any }> = ({ indexedMarket }) => {
  console.log(indexedMarket);

  return (
    <div>
      <div className="flex mb-ztg-33">
        <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600">
          {indexedMarket?.img ? (
            <img
              className="rounded-ztg-10"
              src={indexedMarket.img}
              alt="Market image"
              loading="lazy"
              width={70}
              height={70}
            />
          ) : (
            <img
              className="rounded-ztg-10"
              src="/icons/default-market.png"
              alt="Market image"
              loading="lazy"
              width={70}
              height={70}
            />
          )}
        </div>
        <div className="sub-header ml-ztg-20">{indexedMarket?.question}</div>
      </div>
    </div>
  );
};
export default Market;
