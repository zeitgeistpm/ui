import { Transition } from "@headlessui/react";
import { MarketDispute, Report } from "@zeitgeistpm/sdk/dist/types";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
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
import { ChartSeries } from "components/ui/TimeSeriesChart";
import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import {
  PromotedMarket,
  getMarketPromotion,
} from "lib/cms/get-promoted-markets";
import { ZTG, graphQlEndpoint } from "lib/constants";
import {
  MarketPageIndexedData,
  getMarket,
  getRecentMarketIds,
} from "lib/gql/markets";
import { getResolutionTimestamp } from "lib/gql/resolution-date";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketPoolId } from "lib/hooks/queries/useMarketPoolId";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "react-feather";

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

  let resolutionTimestamp: string | undefined;
  if (market) {
    const { timestamp } = await getResolutionTimestamp(client, market.marketId);

    resolutionTimestamp = timestamp ?? undefined;
  }

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      resolutionTimestamp: resolutionTimestamp ?? null,
      promotionData,
    },
    revalidate: 10 * 60, //10mins
  };
}

type MarketPageProps = {
  indexedMarket: MarketPageIndexedData;
  chartSeries: ChartSeries[];
  resolutionTimestamp: string;
  promotionData: PromotedMarket | null;
};

const Market: NextPage<MarketPageProps> = ({
  indexedMarket,
  chartSeries,
  resolutionTimestamp,
  promotionData,
}) => {
  const [lastDispute, setLastDispute] = useState<MarketDispute>();
  const [report, setReport] = useState<Report>();
  const router = useRouter();
  const { marketid } = router.query;
  const marketId = Number(marketid);

  const [showLiquidityParam, setShowLiquidityParam, unsetShowLiquidityParam] =
    useQueryParamState("showLiquidity");

  const showLiquidity = showLiquidityParam != null;

  const { data: market, isLoading: marketIsLoading } = useMarket({
    marketId,
  });
  const { data: disputes } = useMarketDisputes(marketId);

  const { data: marketStage } = useMarketStage(market ?? undefined);
  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const { data: poolId, isLoading: poolIdLoading } = useMarketPoolId(marketId);
  const baseAsset = parseAssetIdString(indexedMarket?.pool?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAsset);

  const toggleLiquiditySection = () => {
    const nextState = !showLiquidity;
    if (nextState) {
      setShowLiquidityParam("");
    } else {
      unsetShowLiquidityParam();
    }
  };

  if (indexedMarket == null) {
    return <NotFoundPage backText="Back To Markets" backLink="/" />;
  }

  useEffect(() => {
    if (disputes && market?.status === "Disputed") {
      const lastDispute = disputes?.[disputes.length - 1];
      const at = lastDispute.at.toNumber();
      const by = lastDispute.by.toString();
      const isCategorical = !market?.marketType.scalar;
      const outcome = !isCategorical
        ? market.scalarType === "date"
          ? new Decimal(lastDispute?.outcome?.asScalar.toString()).toNumber()
          : Number(lastDispute?.outcome?.asScalar)
        : Number(lastDispute?.outcome?.asCategorical);
      const marketDispute: MarketDispute = {
        at,
        by,
        outcome: isCategorical ? { categorical: outcome } : { scalar: outcome },
      };
      setLastDispute(marketDispute);
    }

    if (market?.report && market?.status === "Reported") {
      const report: Report = {
        at: market?.report?.at,
        by: market?.report?.by,
        outcome: {
          categorical: market?.report?.outcome?.categorical,
          scalar:
            market.scalarType === "date"
              ? new Decimal(
                  market?.report?.outcome?.scalar.toString(),
                ).toNumber()
              : market?.report?.outcome?.scalar,
        },
      };
      setReport(report);
    }
  }, [disputes, market?.report]);

  const token = metadata?.symbol;

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
          resolvedOutcome={market?.resolvedOutcome}
          report={report}
          disputes={lastDispute}
          token={token}
          marketStage={marketStage}
          rejectReason={market?.rejectReason}
        />
        {market?.rejectReason && market.rejectReason.length > 0 && (
          <div className="mt-[10px] text-ztg-14-150">
            Market rejected: {market.rejectReason}
          </div>
        )}

        {chartSeries && indexedMarket?.pool?.poolId ? (
          <MarketChart
            marketId={indexedMarket.marketId}
            chartSeries={chartSeries}
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
              This market doesn't have a liquidity pool and therefore cannot be
              traded
            </div>
          </div>
        )}
        <div className="mb-8">
          <h3 className="text-center text-2xl mt-10 mb-8">Predictions</h3>
          {indexedMarket?.marketType?.scalar !== null && (
            <div className="mb-8 max-w-[800px] mx-auto">
              {marketIsLoading ||
              (!spotPrices?.get(1) && indexedMarket.status !== "Proposed") ||
              (!spotPrices?.get(0) && indexedMarket.status !== "Proposed") ? (
                <Skeleton height="40px" width="100%" />
              ) : (
                <ScalarPriceRange
                  scalarType={indexedMarket.scalarType}
                  lowerBound={new Decimal(indexedMarket.marketType.scalar[0])
                    .div(ZTG)
                    .toNumber()}
                  upperBound={new Decimal(indexedMarket.marketType.scalar[1])
                    .div(ZTG)
                    .toNumber()}
                  shortPrice={spotPrices?.get(1).toNumber()}
                  longPrice={spotPrices?.get(0).toNumber()}
                  status={indexedMarket.status}
                />
              )}
            </div>
          )}
          <MarketAssetDetails marketId={Number(marketid)} />
        </div>

        <div className="lg:px-36 mb-12">
          {indexedMarket.description?.length > 0 && (
            <>
              <h3 className="text-center text-2xl mb-5">About Market</h3>
              <QuillViewer value={indexedMarket.description} />
            </>
          )}
          <PoolDeployer marketId={Number(marketid)} />
          <h3 className="text-center text-2xl mt-10 mb-8">Market Cast</h3>
          <MarketAddresses
            oracleAddress={indexedMarket.oracle}
            creatorAddress={indexedMarket.creator}
          />
        </div>

        <div className="mb-12">
          <div
            className="flex center mb-8 text-mariner cursor-pointer"
            onClick={() => toggleLiquiditySection()}
          >
            <div>Show Liquidity</div>
            <ChevronDown
              size={12}
              viewBox="6 6 12 12"
              className={`box-content px-2 ${showLiquidity && "rotate-180"}`}
            />
          </div>

          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 "
            enterTo="transform opacity-100 "
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 "
            leaveTo="transform opacity-0 "
            show={showLiquidity && Boolean(market?.pool)}
          >
            {market && <MarketLiquiditySection market={market} />}
          </Transition>
        </div>
      </div>
    </>
  );
};

export default Market;
