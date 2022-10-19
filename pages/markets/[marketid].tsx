import { Skeleton } from "@material-ui/lab";
import LiquidityPill from "components/markets/LiquidityPill";
import MarketAddresses from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import MarketTimer from "components/markets/MarketTimer";
import PoolDeployer from "components/markets/PoolDeployer";
import Pill from "components/ui/Pill";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
import { GraphQLClient } from "graphql-request";
import { DAY_SECONDS } from "lib/constants";
import {
  getMarket,
  getMarketIds,
  MarketPageIndexedData,
} from "lib/gql/markets";
import { getBaseAsset } from "lib/gql/pool";
import { getAssetPriceHistory } from "lib/gql/prices";
import { useMarketsStore } from "lib/stores/MarketsStore";
import MarketStore from "lib/stores/MarketStore";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useState } from "react";
import { AlertTriangle } from "react-feather";

export async function getStaticPaths() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  const marketIds = await getMarketIds(client);
  const paths = marketIds.map((marketId) => ({
    params: { marketid: marketId.toString() },
  }));

  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);

  const market = await getMarket(client, params.marketid);

  const dateOneMonthAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 31 * 1000,
  ).toISOString();

  const assetPrices = await Promise.all(
    market?.outcomeAssets?.map((asset) =>
      getAssetPriceHistory(client, asset, dateOneMonthAgo),
    ),
  );

  const chartSeries: ChartSeries[] = market.categories?.map(
    (category, index) => {
      return {
        accessor: `v${index}`,
        label: category.ticker.toUpperCase(),
        color: category.color,
      };
    },
  );

  const chartData: ChartData[] = assetPrices?.flatMap((prices, index) => {
    return prices.map((price) => {
      return {
        t: new Date(price.timestamp).getTime(),
        ["v" + index]: price.newPrice,
      };
    });
  });

  const baseAsset = market.poolId
    ? await getBaseAsset(client, market.poolId)
    : null;

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      chartData: chartData ?? null,
      baseAsset: baseAsset?.toUpperCase() ?? "ZTG",
    },
    revalidate: 10 * 60, //10mins
  };
}

const Market: NextPage<{
  indexedMarket: MarketPageIndexedData;
  chartSeries: ChartSeries[];
  chartData: ChartData[];
  baseAsset: string;
}> = observer(({ indexedMarket, chartSeries, chartData, baseAsset }) => {
  const marketsStore = useMarketsStore();
  const router = useRouter();
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const [prizePool, setPrizePool] = useState<string>();
  const { marketid } = router.query;
  const store = useStore();
  const [pool, setPool] = useState<CPool>();
  const poolStore = usePoolsStore();
  const [hasAuthReport, setHasAuthReport] = useState<boolean>();

  if (indexedMarket == null) {
    return <NotFoundPage backText="Back To Markets" backLink="/" />;
  }

  const fetchMarket = async () => {
    const market = await marketsStore?.getMarket(Number(marketid));
    if (market != null) {
      setMarketStore(market);
      const prizePool = await market.getPrizePool();
      setPrizePool(prizePool);

      if (market.poolExists) {
        const { poolId } = market.pool;
        const pool = await poolStore.getPoolFromChain(Number(poolId));

        setPool(pool);
      }

      const report =
        await store.sdk.api.query.authorized.authorizedOutcomeReports(
          market.id,
        );

      setHasAuthReport(report.isEmpty === false);
    }
  };

  useEffect(() => {
    if (!store) return;
    fetchMarket();
  }, [marketsStore, marketid]);

  const handlePoolDeployed = () => {
    fetchMarket();
  };

  //required to fix title element warning
  const question = indexedMarket.question;

  return (
    <>
      <Head>
        <title>{question}</title>
        <meta name="description" content={indexedMarket.description} />
      </Head>
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
        <div
          className="grid grid-flow-row-dense gap-4 w-full "
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          }}
        >
          <Pill
            title="Ends"
            value={new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
            }).format(indexedMarket.end)}
          />
          <Pill title="Status" value={indexedMarket.status} />
          {prizePool ? (
            <Pill
              title="Prize Pool"
              value={`${prizePool} ${store?.config.tokenSymbol}`}
            />
          ) : (
            <></>
          )}
          {pool?.liquidity != null ? (
            <LiquidityPill liquidity={pool.liquidity} />
          ) : (
            <></>
          )}
        </div>
        <div className="mb-ztg-20">
          {marketStore ? (
            <MarketTimer
              marketStore={marketStore}
              hasAuthReport={hasAuthReport}
            />
          ) : (
            <Skeleton
              className="!py-ztg-10 !rounded-ztg-10 !transform-none"
              height={70}
            />
          )}
        </div>
        {chartData?.length > 0 && chartSeries ? (
          <div className="-ml-ztg-25">
            <TimeSeriesChart
              data={chartData}
              series={chartSeries}
              yDomain={[0, 1]}
              yUnits={baseAsset}
            />
          </div>
        ) : (
          <></>
        )}
        {marketStore?.poolExists === false && (
          <div className="flex h-ztg-22 items-center font-lato bg-vermilion-light text-vermilion p-ztg-20 rounded-ztg-5">
            <div className="w-ztg-20 h-ztg-20">
              <AlertTriangle size={20} />
            </div>
            <div
              className="text-ztg-12-120 ml-ztg-10 "
              data-test="liquidityPoolMessage"
            >
              This market doesn't have a liquidity pool and therefore cannot be
              traded
            </div>
          </div>
        )}
        {<MarketAssetDetails marketStore={marketStore} />}
        <div className="sub-header mt-ztg-40 mb-ztg-15">About Market</div>
        <div className="font-lato text-ztg-14-180 text-sky-600">
          {indexedMarket.description}
        </div>
        <PoolDeployer
          marketStore={marketStore}
          onPoolDeployed={handlePoolDeployed}
        />
        {marketStore && <MarketAddresses marketStore={marketStore} />}
      </div>
    </>
  );
});
export default Market;
