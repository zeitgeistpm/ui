import PoolTable from "components/liquidity/PoolTable";
import MarketAddresses from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import {
  MarketTimer,
  MarketTimerSkeleton,
} from "components/markets/MarketTimer";
import PoolDeployer from "components/markets/PoolDeployer";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import MarketMeta from "components/meta/MarketMeta";
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
import { useMarketsStore } from "lib/stores/MarketsStore";
import MarketStore from "lib/stores/MarketStore";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useState } from "react";
import { AlertTriangle } from "react-feather";
import { Tab } from "@headlessui/react";
import Link from "next/link";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import MarketHeader from "components/markets/MarketHeader";
import MarketChart from "components/markets/MarketChart";
import {
  getPriceHistory,
  PriceHistory,
  useMarketPriceHistory,
} from "lib/hooks/queries/useMarketPriceHistory";
import TimeFilters, { filters } from "components/ui/TimeFilters";

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

  const chartSeries: ChartSeries[] = market?.categories?.map(
    (category, index) => {
      return {
        accessor: `v${index}`,
        label: category.name,
        color: category.color,
      };
    },
  );

  const baseAsset =
    market?.pool != null
      ? await getBaseAsset(client, market.pool.poolId)
      : null;

  const priceHistory = await getPriceHistory(
    client,
    market.marketId,
    filters[1].interval,
    filters[1].time,
  );

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      priceHistory: priceHistory ?? null,
      baseAsset: baseAsset?.toUpperCase() ?? "ZTG",
    },
    revalidate: 10 * 60, //10mins
  };
}

const Market: NextPage<{
  indexedMarket: MarketPageIndexedData;
  chartSeries: ChartSeries[];
  priceHistory: PriceHistory[];
  baseAsset: string;
}> = observer(({ indexedMarket, chartSeries, priceHistory, baseAsset }) => {
  const marketsStore = useMarketsStore();
  const router = useRouter();
  const { marketid } = router.query;
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const [prizePool, setPrizePool] = useState<number>();
  const store = useStore();
  const [pool, setPool] = useState<CPool>();
  const poolStore = usePoolsStore();

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

  //data for MarketHeader
  const token = store?.config?.tokenSymbol;
  const starts = Number(indexedMarket.period.start);
  const ends = Number(indexedMarket.period.end);
  const volume = indexedMarket?.pool?.volume
    ? new Decimal(indexedMarket?.pool?.volume).div(ZTG).toNumber()
    : 0;
  const subsidy = marketSdkv2?.pool?.poolId == null ? 0 : pool?.liquidity;

  return (
    <>
      <MarketMeta market={indexedMarket} />
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
          starts={starts}
          ends={ends}
          token={token}
          prizePool={prizePool}
          volume={volume}
          subsidy={subsidy}
        />
        {marketSdkv2?.rejectReason && marketSdkv2.rejectReason.length > 0 && (
          <div className="mt-[10px] text-ztg-14-150">
            Market rejected: {marketSdkv2.rejectReason}
          </div>
        )}
        <div className="flex justify-center py-ztg-50 mb-10 h-32">
          {marketStage ? (
            <MarketTimer stage={marketStage} />
          ) : (
            <MarketTimerSkeleton />
          )}
        </div>
        {priceHistory?.length > 0 &&
        chartSeries &&
        indexedMarket?.pool?.poolId ? (
          <MarketChart
            marketId={indexedMarket.marketId}
            chartSeries={chartSeries}
            initialData={priceHistory}
            baseAsset={baseAsset}
            poolCreationDate={indexedMarket?.pool?.createdAt}
          />
        ) : (
          <></>
        )}
        {marketSdkv2?.pool?.poolId == null && marketIsLoading === false && (
          <div className="flex h-ztg-22 items-center bg-vermilion-light text-vermilion p-ztg-20 rounded-ztg-5">
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
        <div className="mb-12">
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
        </div>
        <div className="lg:px-36">
          {marketStore?.type === "scalar" && spotPrices && (
            <div className="mb-12">
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
              <h3 className="text-center text-2xl font-semibold mb-5">
                About Market
              </h3>
              <QuillViewer value={indexedMarket.description} />
            </>
          )}
          <PoolDeployer
            marketStore={marketStore}
            onPoolDeployed={handlePoolDeployed}
          />
          <h3 className="text-center text-2xl font-semibold mt-10">
            Market Cast
          </h3>
          <MarketAddresses
            oracleAddress={indexedMarket.oracle}
            creatorAddress={indexedMarket.creator}
          />
        </div>
      </div>
    </>
  );
});
export default Market;
