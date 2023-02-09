import { FC } from "react";
import PoolTable from "components/liquidity/PoolTable";
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
import { Tab } from "@headlessui/react";
import { hasEnded } from "lib/util/hasEnded";
import Link from "next/link";

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
  const [prizePool, setPrizePool] = useState<number>();
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
      setPrizePool(Number(prizePool));

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

  const HeaderStat: FC<{ label: string; border?: boolean }> = ({
    label,
    border = true,
    children,
  }) => {
    return (
      <div className={border ? "sm:border-r sm:border-ztg-blue pr-2" : ""}>
        <span>{label}: </span>
        <span className="font-medium">{children}</span>
      </div>
    );
  };

  const Tag: FC<{ className?: string }> = ({ className, children }) => {
    return (
      <span className={`px-2.5 py-1 rounded bg-gray-300 ${className}`}>
        {children}
      </span>
    );
  };

  const MarketHeader: FC<{
    question: string;
    status: string;
    tags: string[];
    createdAt: number;
    ends: number;
    prizePool: number;
    subsidy: number;
    volume: number;
    token: string;
  }> = ({
    question,
    status,
    tags,
    createdAt,
    ends,
    prizePool,
    subsidy,
    volume,
    token,
  }) => {
    return (
      <header className="text-center">
        <h1 className="font-bold text-4xl my-5">{question}</h1>
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 mb-5">
          <HeaderStat label="Created">
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
            }).format(createdAt)}
          </HeaderStat>
          <HeaderStat label={hasEnded(ends) ? "Ended" : "Ends"}>
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
            }).format(ends)}
          </HeaderStat>
          {token ? (
            <HeaderStat label="Volume">
              {/* TODO: replace num formatting with util function */}
              {new Intl.NumberFormat("default", {
                maximumSignificantDigits: 3,
                notation: "compact",
              }).format(volume)}
              &nbsp;
              {token}
            </HeaderStat>
          ) : (
            <Skeleton width="150px" height="24px" />
          )}
          {prizePool >= 0 && token ? (
            <HeaderStat label="Prize Pool">
              {/* TODO: replace num formatting with util function */}
              {new Intl.NumberFormat("default", {
                maximumSignificantDigits: 3,
                notation: "compact",
              }).format(prizePool)}
              &nbsp;
              {token}
            </HeaderStat>
          ) : (
            <Skeleton width="150px" height="24px" />
          )}
          {subsidy >= 0 && token ? (
            <HeaderStat label="Subsidy" border={false}>
              {/* TODO: replace num formatting with util function */}
              {new Intl.NumberFormat("default", {
                maximumSignificantDigits: 3,
                notation: "compact",
              }).format(subsidy)}
              &nbsp;
              {token}
            </HeaderStat>
          ) : (
            <Skeleton width="150px" height="24px" />
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Tag className={`${status === "Active" && "!bg-green-lighter"}`}>
            {status === "Active" && (
              <span className="text-green">&#x2713; </span>
            )}
            {status}
          </Tag>
          {tags?.map((tag, index) => {
            return <Tag key={index}>{tag}</Tag>;
          })}
        </div>
      </header>
    );
  };

  //data for MarketHeader
  const token = store?.config?.tokenSymbol && store.config.tokenSymbol;
  const createdAt = indexedMarket?.pool?.createdAt
    ? new Date(indexedMarket.pool.createdAt).getTime()
    : Number(indexedMarket.period.start);
  const ends = Number(indexedMarket.period.end);
  const volume = indexedMarket?.pool?.volume
    ? Number(indexedMarket?.pool?.volume)
    : 0;
  // -1 to indicate loading state since type is number
  const prize = prizePool === undefined ? -1 : prizePool ? prizePool : 0;
  const subsidy =
    pool === undefined ? -1 : pool?.liquidity ? Number(pool?.liquidity) : 0;

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
        <MarketImage
          image={indexedMarket.img}
          alt={`Image depicting ${question}`}
          size="120px"
          status={indexedMarket.status}
          className="mx-auto"
        />
        <MarketHeader
          question={question}
          status={indexedMarket.status}
          tags={indexedMarket.tags}
          createdAt={createdAt}
          ends={ends}
          token={token}
          prizePool={prize}
          volume={volume}
          subsidy={subsidy}
        />
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
        <Tab.Group>
          <Tab.List className="flex center my-6">
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500 transition-all">
              Predictions
            </Tab>
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500 transition-all">
              Subsidy
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              <MarketAssetDetails
                marketId={Number(marketid)}
                marketStore={marketStore}
              />
            </Tab.Panel>
            <Tab.Panel>
              {marketSdkv2?.pool && (
                <div className="flex flex-col">
                  <Link
                    href={`/liquidity/${marketSdkv2.pool.poolId}`}
                    className="text-sky-600 bg-sky-200 dark:bg-black ml-auto uppercase font-bold text-ztg-12-120 rounded-ztg-5 px-ztg-20 py-ztg-5 mb-[10px] "
                  >
                    View Pool
                  </Link>
                  <PoolTable poolId={marketSdkv2.pool.poolId} />
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

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
