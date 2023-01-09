import { Skeleton } from "@material-ui/lab";
import { ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import LiquidityPill from "components/markets/LiquidityPill";
import MarketAddresses from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import MarketTimer from "components/markets/MarketTimer";
import PoolDeployer from "components/markets/PoolDeployer";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import { Og } from "components/og/Og";
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
import useMarketImageUrl from "lib/hooks/useMarketImageUrl";
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
import { combineLatest, from } from "rxjs";

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
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const [prizePool, setPrizePool] = useState<string>();
  const { marketid } = router.query;
  const store = useStore();
  const [pool, setPool] = useState<CPool>();
  const poolStore = usePoolsStore();
  const [hasAuthReport, setHasAuthReport] = useState<boolean>();
  const marketImageUrl = useMarketImageUrl(indexedMarket.img);

  const [scalarPrices, setScalarPrices] =
    useState<{ short: number; long: number; type: ScalarRangeType }>();

  useEffect(() => {
    if (marketStore == null) return;
    if (marketStore.type === "scalar") {
      const observables = marketStore.marketOutcomes
        .filter((o) => o.metadata !== "ztg")
        .map((outcome) => {
          return from(marketStore.assetPriceInZTG(outcome.asset));
        });
      const sub = combineLatest(observables).subscribe((prices) => {
        setScalarPrices({
          type: marketStore.scalarType,
          short: prices[1].toNumber(),
          long: prices[0].toNumber(),
        });
      });
      return () => sub.unsubscribe();
    }
  }, [marketStore, marketStore?.pool]);

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
      <Og
        title={indexedMarket.question}
        description={indexedMarket.description}
        image={`/api/og?marketId=${indexedMarket.marketId}`}
      />
      <div>
        <div className="flex mb-ztg-33">
          <MarketImage
            image={indexedMarket.img}
            alt={`Image depicting ${question}`}
          />
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
        <MarketAssetDetails marketStore={marketStore} />
        {marketStore?.type === "scalar" && scalarPrices && (
          <div className="mt-ztg-20 mb-ztg-30">
            <ScalarPriceRange
              scalarType={scalarPrices.type}
              lowerBound={marketStore.bounds[0]}
              upperBound={marketStore.bounds[1]}
              shortPrice={scalarPrices.short}
              longPrice={scalarPrices.long}
            />
          </div>
        )}
        <div className="sub-header mt-ztg-40 mb-ztg-15">About Market</div>
        {<QuillViewer value={indexedMarket.description} />}
        <PoolDeployer
          marketStore={marketStore}
          onPoolDeployed={handlePoolDeployed}
        />
        <MarketAddresses
          oracleAddress={indexedMarket.oracle}
          authorityAddress={indexedMarket.disputeMechanism?.authorized}
          creatorAddress={indexedMarket.creator}
        />
      </div>
    </>
  );
});
export default Market;
