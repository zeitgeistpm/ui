import { Tab } from "@headlessui/react";
import { parseAssetId } from "@zeitgeistpm/sdk-next";
import { MarketDispute, Report } from "@zeitgeistpm/sdk/dist/types";
import PoolTable from "components/liquidity/PoolTable";
import MarketAddresses from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import MarketChart from "components/markets/MarketChart";
import MarketHeader from "components/markets/MarketHeader";
import PoolDeployer from "components/markets/PoolDeployer";
import { MarketPromotionCallout } from "components/markets/PromotionCallout";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import MarketMeta from "components/meta/MarketMeta";
import MarketImage from "components/ui/MarketImage";
import Skeleton from "components/ui/Skeleton";
import { filters } from "components/ui/TimeFilters";
import { ChartSeries } from "components/ui/TimeSeriesChart";
import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import {
  getMarketPromotion,
  PromotedMarket,
} from "lib/cms/get-promoted-markets";
import { graphQlEndpoint, ZTG } from "lib/constants";
import {
  getMarket,
  getRecentMarketIds,
  MarketPageIndexedData,
} from "lib/gql/markets";
import { getResolutionTimestamp } from "lib/gql/resolution-date";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketPoolId } from "lib/hooks/queries/useMarketPoolId";
import {
  getPriceHistory,
  PriceHistory,
} from "lib/hooks/queries/useMarketPriceHistory";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { usePrizePool } from "lib/hooks/queries/usePrizePool";
import { calcPriceHistoryStartDate } from "lib/util/calc-price-history-start";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useState } from "react";
import { AlertTriangle } from "react-feather";

export const QuillViewer = dynamic(
  () => import("../../components/ui/QuillViewer"),
  {
    ssr: false,
  },
);

export async function getStaticPaths() {
  const client = new GraphQLClient(graphQlEndpoint);
  const marketIds = await getRecentMarketIds(client);

  const paths = marketIds.map((market) => ({
    params: { marketid: market.toString() },
  }));

  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const client = new GraphQLClient(graphQlEndpoint);

  const [market, promotionData] = await Promise.all([
    getMarket(client, params.marketid),
    getMarketPromotion(Number(params.marketid)),
  ]);

  const chartSeries: ChartSeries[] = market?.categories?.map(
    (category, index) => {
      return {
        accessor: `v${index}`,
        label: category.name,
        color: category.color,
      };
    },
  );

  let priceHistory: PriceHistory[];
  let resolutionTimestamp: string;
  if (market.pool) {
    const chartFilter = filters[1];

    resolutionTimestamp = await getResolutionTimestamp(client, market.marketId);

    const chartStartDate = calcPriceHistoryStartDate(
      market.status,
      chartFilter,
      new Date(market.pool.createdAt),
      new Date(resolutionTimestamp),
    );

    priceHistory = await getPriceHistory(
      client,
      market.marketId,
      chartFilter.intervalUnit,
      chartFilter.intervalValue,
      chartStartDate.toISOString(),
    );
  }

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      priceHistory: priceHistory ?? null,
      resolutionTimestamp: resolutionTimestamp ?? null,
      promotionData,
    },
    revalidate: 10 * 60, //10mins
  };
}

type MarketPageProps = {
  indexedMarket: MarketPageIndexedData;
  chartSeries: ChartSeries[];
  priceHistory: PriceHistory[];
  resolutionTimestamp: string;
  promotionData: PromotedMarket | null;
};

const Market: NextPage<MarketPageProps> = observer(
  ({
    indexedMarket,
    chartSeries,
    priceHistory,
    resolutionTimestamp,
    promotionData,
  }) => {
    const [lastDispute, setLastDispute] = useState<MarketDispute>(null);
    const [report, setReport] = useState<Report>(null);
    const router = useRouter();
    const { marketid } = router.query;
    const marketId = Number(marketid);
    const { data: prizePool } = usePrizePool(marketId);
    const { data: marketSdkv2, isLoading: marketIsLoading } = useMarket({
      marketId,
    });

    const { data: disputes } = useMarketDisputes(marketId);

    const { data: marketStage } = useMarketStage(marketSdkv2);
    const { data: spotPrices } = useMarketSpotPrices(marketId);
    const { data: liquidity } = usePoolLiquidity({ marketId });
    const { data: poolId, isLoading: poolIdLoading } =
      useMarketPoolId(marketId);
    const baseAsset = parseAssetId(indexedMarket.pool?.baseAsset).unrightOr(
      null,
    );
    const { data: metadata } = useAssetMetadata(baseAsset);

    if (indexedMarket == null) {
      return <NotFoundPage backText="Back To Markets" backLink="/" />;
    }

    useEffect(() => {
      if (disputes && marketSdkv2?.status === "Disputed") {
        const lastDispute = disputes?.[disputes.length - 1];
        const at = lastDispute.at.toNumber();
        const by = lastDispute.by.toString();
        const outcome = marketSdkv2?.marketType.scalar
          ? lastDispute?.outcome?.asScalar.toNumber()
          : lastDispute?.outcome?.asCategorical.toNumber();
        const marketDispute: MarketDispute = {
          at,
          by,
          outcome: {
            categorical: outcome,
            scalar: outcome,
          },
        };
        setLastDispute(marketDispute);
      }
      if (marketSdkv2?.report && marketSdkv2?.status === "Reported") {
        const report: Report = {
          at: marketSdkv2?.report?.at,
          by: marketSdkv2?.report?.by,
          outcome: {
            categorical: marketSdkv2?.report?.outcome?.categorical,
            scalar: marketSdkv2?.report?.outcome?.scalar,
          },
        };
        setReport(report);
      }
    }, [disputes, marketSdkv2?.report]);

    //data for MarketHeader
    const token = metadata?.symbol;

    const subsidy =
      marketSdkv2?.pool?.poolId == null ? 0 : liquidity?.div(ZTG).toNumber();

    return (
      <>
        <MarketMeta market={indexedMarket} />
        <div>
          <MarketImage
            image={indexedMarket.img}
            alt={`Image depicting ${indexedMarket.question}`}
            size="120px"
            status={indexedMarket.status}
            className="mx-auto"
          />

          <div className="mt-4">
            {promotionData && (
              <MarketPromotionCallout
                market={indexedMarket}
                promotion={promotionData}
              />
            )}
          </div>

          <MarketHeader
            market={indexedMarket}
            resolvedOutcome={marketSdkv2?.resolvedOutcome}
            report={report}
            disputes={lastDispute}
            token={token}
            prizePool={prizePool?.div(ZTG).toNumber()}
            subsidy={subsidy}
            marketStage={marketStage}
            rejectReason={marketSdkv2?.rejectReason}
          />
          {marketSdkv2?.rejectReason && marketSdkv2.rejectReason.length > 0 && (
            <div className="mt-[10px] text-ztg-14-150">
              Market rejected: {marketSdkv2.rejectReason}
            </div>
          )}

          {chartSeries && indexedMarket?.pool?.poolId ? (
            <MarketChart
              marketId={indexedMarket.marketId}
              chartSeries={chartSeries}
              initialData={priceHistory}
              baseAsset={indexedMarket.pool.baseAsset}
              poolCreationDate={new Date(indexedMarket.pool.createdAt)}
              marketStatus={indexedMarket.status}
              resolutionDate={new Date(resolutionTimestamp)}
            />
          ) : (
            <></>
          )}
          {poolId == null && poolIdLoading === false && (
            <div className="flex h-ztg-22 items-center bg-vermilion-light text-vermilion p-ztg-20 rounded-ztg-5">
              <div className="w-ztg-20 h-ztg-20">
                <AlertTriangle size={20} />
              </div>
              <div
                className="text-ztg-12-120 ml-ztg-10 "
                data-test="liquidityPoolMessage"
              >
                This market doesn't have a liquidity pool and therefore cannot
                be traded
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
              {indexedMarket?.marketType?.scalar !== null && (
                <div className="mb-8 max-w-[800px] mx-auto">
                  {marketIsLoading ||
                  (!spotPrices?.get(1) &&
                    indexedMarket.status !== "Proposed") ||
                  (!spotPrices?.get(0) &&
                    indexedMarket.status !== "Proposed") ? (
                    <Skeleton height="40px" width="100%" />
                  ) : (
                    <ScalarPriceRange
                      scalarType={indexedMarket.scalarType}
                      lowerBound={new Decimal(
                        indexedMarket.marketType.scalar[0],
                      )
                        .div(ZTG)
                        .toNumber()}
                      upperBound={new Decimal(
                        indexedMarket.marketType.scalar[1],
                      )
                        .div(ZTG)
                        .toNumber()}
                      shortPrice={spotPrices?.get(1).toNumber()}
                      longPrice={spotPrices?.get(0).toNumber()}
                      status={indexedMarket.status}
                    />
                  )}
                </div>
              )}
              <Tab.Panels>
                <Tab.Panel>
                  <MarketAssetDetails marketId={Number(marketid)} />
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
                      <PoolTable
                        poolId={marketSdkv2.pool.poolId}
                        marketId={Number(marketid)}
                      />
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
          <div className="lg:px-36">
            {indexedMarket.description?.length > 0 && (
              <>
                <h3 className="text-center text-2xl mb-5">About Market</h3>
                <QuillViewer value={indexedMarket.description} />
              </>
            )}
            <PoolDeployer marketId={Number(marketid)} />
            <h3 className="text-center text-2xl mt-10">Market Cast</h3>
            <MarketAddresses
              oracleAddress={indexedMarket.oracle}
              creatorAddress={indexedMarket.creator}
            />
          </div>
        </div>
      </>
    );
  },
);
export default Market;
