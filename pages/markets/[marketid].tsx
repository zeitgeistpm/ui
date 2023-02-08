import { FC } from "react";
import LiquidityPill from "components/markets/LiquidityPill";
import MarketAddresses from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import {
  MarketTimer,
  MarketTimerSkeleton,
} from "components/markets/MarketTimer";
import { Skeleton } from "@material-ui/lab";
import PoolDeployer from "components/markets/PoolDeployer";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import MarketImage from "components/ui/MarketImage";
import Pill from "components/ui/Pill";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
import { GraphQLClient } from "graphql-request";
import {
  getMarket,
  getRecentMarketIds,
  MarketPageIndexedData,
} from "lib/gql/markets";
import { getBaseAsset } from "lib/gql/pool";
import { getAssetPriceHistory } from "lib/gql/prices";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import useMarketImageUrl from "lib/hooks/useMarketImageUrl";
import { useMarketsStore } from "lib/stores/MarketsStore";
import MarketStore from "lib/stores/MarketStore";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useState } from "react";
import { AlertTriangle } from "react-feather";

const QuillViewer = dynamic(() => import("../../components/ui/QuillViewer"), {
  ssr: false,
});

export async function getStaticPaths() {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);
  const marketIds = await getRecentMarketIds(client);

  const paths = marketIds.map((market) => ({
    params: { marketid: market.toString() },
  }));

  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
  const client = new GraphQLClient(url);

  const market = await getMarket(client, params.marketid);

  const startDate = new Date(Number(market?.period.start)).toISOString();
  const assetPrices = market?.outcomeAssets
    ? await Promise.all(
        market?.outcomeAssets?.map((asset) =>
          getAssetPriceHistory(client, asset, startDate),
        ),
      )
    : undefined;

  const chartSeries: ChartSeries[] = market?.categories?.map(
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

  const baseAsset =
    market?.pool != null
      ? await getBaseAsset(client, market.pool.poolId)
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
  const { marketid } = router.query;
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const [prizePool, setPrizePool] = useState<string>();
  const store = useStore();
  const [pool, setPool] = useState<CPool>();
  const poolStore = usePoolsStore();
  const marketImageUrl = useMarketImageUrl(indexedMarket.img);

  const { data: marketSdkv2, isLoading: marketIsLoading } = useMarket({
    marketId: Number(marketid),
  });
  const { data: marketStage } = useMarketStage(marketSdkv2);
  const { data: spotPrices } = useMarketSpotPrices(Number(marketid));

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

  const MarketHeader: FC<{
    img: string;
    question: string;
    status: string;
    starts: string;
    ends: string;
    prizePool: string;
    subsidy: string;
    volume: string;
  }> = ({
    img,
    question,
    status,
    starts,
    ends,
    prizePool,
    subsidy,
    volume,
  }) => {
    return (
      <header className="text-center">
        <MarketImage
          image={img}
          alt={`Image depicting ${question}`}
          size="120px"
          status={status}
          className="mx-auto"
        />
        <h1 className="font-bold text-4xl">{question}</h1>
        <div>
          {starts ? (
            <div>
              <span>Created: </span>
              <span>{starts}</span>
            </div>
          ) : (
            <Skeleton width="200px" height="50px" />
          )}
          {ends ? (
            <div>
              <span>Ends: </span>
              <span>{ends}</span>
            </div>
          ) : (
            <Skeleton width="200px" height="50px" />
          )}
          {volume ? (
            <div>
              <span>Volumes: </span>
              <span>{volume}</span>
            </div>
          ) : (
            <Skeleton width="200px" height="50px" />
          )}
          {prizePool ? (
            <div>
              <span>Prize Pool: </span>
              <span>{prizePool}</span>
            </div>
          ) : (
            <Skeleton width="200px" height="50px" />
          )}
          {subsidy ? (
            <div>
              <span>Subsidy: </span>
              <span>{subsidy}</span>
            </div>
          ) : (
            <Skeleton width="200px" height="50px" />
          )}
        </div>
      </header>
    );
  };

  // const getHeaderDetails = () => {
  //     const headerInfo = {
  //       Created: new Intl.DateTimeFormat("en-US", {
  //         dateStyle: "medium",
  //       }).format(Number(indexedMarket.period.start)),
  //       Ends: new Intl.DateTimeFormat("en-US", {
  //         dateStyle: "medium",
  //       }).format(Number(indexedMarket.period.end)),
  //       Volume: indexedMarket?.pool?.volume
  //         ? `${Number(indexedMarket?.pool?.volume)} ${
  //             store?.config.tokenSymbol
  //           }`
  //         : "0",
  //       "Prize Pool": `${prizePool} ${store?.config.tokenSymbol}`,
  //       Subsidy: `${Number.isNaN(pool.liquidity) ? "0" : pool.liquidity} ${
  //         store?.config.tokenSymbol
  //       }`,
  //     };
  //     return headerInfo;
  // };

  const starts = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(Number(indexedMarket.period.start));
  const ends = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(Number(indexedMarket.period.end));
  const prize = prizePool && `${prizePool} ${store?.config.tokenSymbol}`;
  const subsidy =
    pool?.liquidity != null &&
    `${Number.isNaN(pool.liquidity) ? "0" : pool.liquidity} ${
      store?.config.tokenSymbol
    }`;
  const volume =
    store?.config.tokenSymbol && indexedMarket?.pool?.volume
      ? `${Number(indexedMarket?.pool?.volume)} ${store?.config.tokenSymbol}`
      : "0";

  return (
    <>
      <Head>
        <title>{question}</title>
        <meta name="description" content={indexedMarket.description} />
        <meta property="og:description" content={indexedMarket.question} />
        {marketImageUrl && (
          <meta property="og:image" content={marketImageUrl} />
        )}
      </Head>
      <div>
        <MarketHeader
          img={indexedMarket.img}
          question={question}
          status={indexedMarket.status}
          starts={starts}
          ends={ends}
          prizePool={prize}
          volume={volume}
          subsidy={subsidy}
        />
        {/* <MarketImage
            image={indexedMarket.img}
            alt={`Image depicting ${question}`}
          /> */}
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
            }).format(Number(indexedMarket.period.end))}
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
            <LiquidityPill
              liquidity={Number.isNaN(pool.liquidity) ? 0 : pool.liquidity}
            />
          ) : (
            <></>
          )}
        </div>
        {marketSdkv2?.rejectReason && marketSdkv2.rejectReason.length > 0 && (
          <div className="mt-[10px] text-ztg-14-150">
            Market rejected: {marketSdkv2.rejectReason}
          </div>
        )}
        <div className="py-ztg-20 mb-10 h-32">
          {marketStore && marketStage ? (
            <MarketTimer stage={marketStage} />
          ) : (
            <MarketTimerSkeleton />
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
        {marketSdkv2?.pool?.poolId == null && marketIsLoading === false && (
          <div className="flex h-ztg-22 items-center  bg-vermilion-light text-vermilion p-ztg-20 rounded-ztg-5">
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
        <MarketAssetDetails
          marketId={Number(marketid)}
          marketStore={marketStore}
        />
        {marketStore?.type === "scalar" && spotPrices && (
          <div className="mt-ztg-20 mb-ztg-30">
            <ScalarPriceRange
              scalarType={marketStore.scalarType}
              lowerBound={marketStore.bounds[0]}
              upperBound={marketStore.bounds[1]}
              shortPrice={spotPrices?.get(1).toNumber()}
              longPrice={spotPrices?.get(0).toNumber()}
            />
          </div>
        )}
        {indexedMarket.description?.length > 0 && (
          <>
            <div className="sub-header mt-ztg-40 mb-ztg-15">About Market</div>
            <QuillViewer value={indexedMarket.description} />
          </>
        )}
        <PoolDeployer
          marketStore={marketStore}
          onPoolDeployed={handlePoolDeployed}
        />
        <div className="sub-header my-ztg-40 text-center">Market Cast</div>
        <MarketAddresses
          oracleAddress={indexedMarket.oracle}
          creatorAddress={indexedMarket.creator}
        />
      </div>
    </>
  );
});
export default Market;
