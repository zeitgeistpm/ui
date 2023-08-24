import { Transition } from "@headlessui/react";
import {
  MarketOutcomeAssetId,
  getIndexOf,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import { MarketDispute } from "@zeitgeistpm/sdk/dist/types";
import { MarketStatus, FullMarketFragment } from "@zeitgeistpm/indexer";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import { AddressDetails } from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import MarketChart from "components/markets/MarketChart";
import MarketHeader from "components/markets/MarketHeader";
import PoolDeployer from "components/markets/PoolDeployer";
import { MarketPromotionCallout } from "components/markets/PromotionCallout";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import MarketMeta from "components/meta/MarketMeta";
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
import { useSimilarMarkets } from "lib/hooks/queries/useSimilarMarkets";
import { useTradeItem } from "lib/hooks/trade";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import {
  MarketOutcome,
  MarketReport,
  isMarketCategoricalOutcome,
  isMarketScalarOutcome,
  isValidMarketReport,
} from "lib/types";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "react-feather";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import { MarketCategoricalOutcome } from "lib/types";
import { MarketScalarOutcome } from "lib/types";
import CategoricalReportBox from "components/outcomes/CategoricalReportBox";
import { AiOutlineFileAdd, AiOutlineFileDone } from "react-icons/ai";
import { TwitterBird } from "components/markets/TradeResult";
import { useWallet } from "lib/state/wallet";

const TradeForm = dynamic(() => import("../../components/trade-form"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "606px" }} />,
});

const SimilarMarketsSection = dynamic(
  () => import("../../components/markets/SimilarMarketsSection"),
  {
    ssr: false,
  },
);

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
    revalidate: 1 * 60, //1min
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
  const [report, setReport] = useState<MarketReport>();
  const router = useRouter();
  const { marketid } = router.query;
  const marketId = Number(marketid);

  const { data: similarMarkets } = useSimilarMarkets(marketId);

  const { data: tradeItem, set: setTradeItem } = useTradeItem();

  const outcomeAssets = indexedMarket.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );

  useEffect(() => {
    setTradeItem({
      assetId: outcomeAssets[0],
      action: "buy",
    });
  }, []);

  const [showLiquidityParam, setShowLiquidityParam, unsetShowLiquidityParam] =
    useQueryParamState("showLiquidity");

  const showLiquidity = showLiquidityParam != null;

  const [poolDeployed, setPoolDeployed] = useState(false);

  const { data: market, isLoading: marketIsLoading } = useMarket(
    {
      marketId,
    },
    {
      refetchInterval: poolDeployed ? 1000 : false,
    },
  );
  const { data: disputes } = useMarketDisputes(marketId);

  const { data: marketStage } = useMarketStage(market ?? undefined);
  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const { data: poolId, isLoading: poolIdLoading } = useMarketPoolId(marketId);
  const baseAsset = parseAssetIdString(indexedMarket?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAsset);

  const wallet = useWallet();

  const handlePoolDeployed = () => {
    setPoolDeployed(true);
    setShowLiquidityParam("");
  };

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

    if (
      market?.report &&
      market?.status === "Reported" &&
      isValidMarketReport(market.report)
    ) {
      const report: MarketReport = {
        at: market.report.at,
        by: market.report.by,
        outcome: isMarketCategoricalOutcome(market.report.outcome)
          ? { categorical: market.report.outcome.categorical }
          : { scalar: market.report.outcome.scalar?.toString() },
      };
      setReport(report);
    }
  }, [disputes, market?.report]);

  const token = metadata?.symbol;

  return (
    <div className="flex">
      <div className="flex flex-auto gap-12 relative">
        <div className="flex-1">
          <MarketMeta market={indexedMarket} />

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
            resolvedOutcome={market?.resolvedOutcome ?? undefined}
            report={report}
            disputes={lastDispute}
            token={token}
            marketStage={marketStage ?? undefined}
            rejectReason={market?.rejectReason ?? undefined}
          />
          {market?.rejectReason && market.rejectReason.length > 0 && (
            <div className="mt-[10px] text-ztg-14-150">
              Market rejected: {market.rejectReason}
            </div>
          )}

          {chartSeries && indexedMarket?.pool?.poolId ? (
            <div className="mt-4">
              <MarketChart
                marketId={indexedMarket.marketId}
                chartSeries={chartSeries}
                baseAsset={indexedMarket.pool.baseAsset}
                poolCreationDate={new Date(indexedMarket.pool.createdAt)}
                marketStatus={indexedMarket.status}
                resolutionDate={new Date(resolutionTimestamp)}
              />
            </div>
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
          <div className="my-8">
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
                    shortPrice={spotPrices?.get(1)?.toNumber()}
                    longPrice={spotPrices?.get(0)?.toNumber()}
                    status={indexedMarket.status}
                  />
                )}
              </div>
            )}
            <MarketAssetDetails
              marketId={Number(marketid)}
              categories={indexedMarket.categories}
            />
          </div>

          <div className="mb-12">
            {indexedMarket.description?.length > 0 && (
              <>
                <h3 className="text-2xl mb-5">About Market</h3>
                <QuillViewer value={indexedMarket.description} />
              </>
            )}
            <PoolDeployer
              marketId={Number(marketid)}
              onPoolDeployed={handlePoolDeployed}
            />
          </div>

          <AddressDetails title="Oracle" address={indexedMarket.oracle} />

          {market && (market?.pool || poolDeployed) && (
            <div className="my-12">
              <div
                className="flex items-center mb-8 text-mariner cursor-pointer"
                onClick={() => toggleLiquiditySection()}
              >
                <div>Show Liquidity</div>
                <ChevronDown
                  size={12}
                  viewBox="6 6 12 12"
                  className={`box-content px-2 ${
                    showLiquidity && "rotate-180"
                  }`}
                />
              </div>

              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 "
                enterTo="transform opacity-100 "
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 "
                leaveTo="transform opacity-0 "
                show={showLiquidity && Boolean(market?.pool || poolDeployed)}
              >
                <MarketLiquiditySection poll={poolDeployed} market={market} />
              </Transition>
            </div>
          )}
        </div>
        <div className="hidden lg:block w-[460px] min-w-[380px]">
          <div className="sticky top-28">
            <div className="shadow-lg rounded-lg mb-12 opacity-0 animate-pop-in">
              {market?.status === MarketStatus.Active ? (
                <TradeForm outcomeAssets={outcomeAssets} />
              ) : market?.status === MarketStatus.Closed ? (
                <>
                  <ReportForm market={market} />
                </>
              ) : market?.status === MarketStatus.Reported &&
                wallet.realAddress === market.report?.by ? (
                <ReportResult
                  market={market}
                  outcome={market.report?.outcome as MarketOutcome}
                />
              ) : (
                <></>
              )}
            </div>
            <div>
              <SimilarMarketsSection market={market ?? undefined} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportForm = ({ market }: { market: FullMarketFragment }) => {
  const [reportedOutcome, setReportedOutcome] = useState<
    MarketCategoricalOutcome | MarketScalarOutcome | undefined
  >();

  const wallet = useWallet();
  const { data: stage } = useMarketStage(market);

  const connectedWalletIsOracle = market.oracle === wallet.realAddress;

  const userCanReport =
    stage?.type === "OpenReportingPeriod" || !connectedWalletIsOracle;

  return !userCanReport ? (
    <></>
  ) : (
    <div className="py-8 px-5">
      {reportedOutcome ? (
        <ReportResult market={market} outcome={reportedOutcome} />
      ) : (
        <>
          <h4 className="mb-3 flex items-center gap-2">
            <AiOutlineFileAdd size={20} className="text-gray-600" />
            <span>Report Market Outcome</span>
          </h4>

          <p className="mb-5 text-sm">
            Market has closed and the outcome can now be reported.
          </p>

          {stage?.type === "OpenReportingPeriod" && (
            <p className="-mt-3 mb-6 text-sm italic text-gray-500">
              Oracle failed to report. Reporting is now open to all.
            </p>
          )}

          <div className="mb-2">
            {market.marketType?.scalar ? (
              <ScalarReportBox market={market} onReport={setReportedOutcome} />
            ) : (
              <>
                <CategoricalReportBox
                  market={market}
                  onReport={setReportedOutcome}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ReportResult = ({
  market,
  outcome,
}: {
  market: FullMarketFragment;
  outcome: MarketCategoricalOutcome | MarketScalarOutcome;
}) => {
  const outcomeName = isMarketScalarOutcome(outcome)
    ? new Decimal(outcome.scalar).div(ZTG).toFixed(3)
    : market.categories?.[outcome.categorical].name;

  const marketUrl = `https://app.zeitgeist.pm/markets/${market.marketId}`;

  const twitterBaseUrl = "https://twitter.com/intent/tweet?text=";
  const tweetUrl = `${twitterBaseUrl}I just reported the outcome of %40ZeitgeistPM market: "${market.question}" to be ${outcomeName}%0A%0ACheck out the market here%3A%0A&url=${marketUrl}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div>
        <AiOutlineFileDone size={64} className="text-ztg-blue" />
      </div>
      <p className="text">Successfully reported!</p>
      <div className="text-2xl font-semibold mb-4">
        {"scalar" in outcome && "Value: "}
        {outcomeName}
      </div>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={tweetUrl}
        className="mb-4"
      >
        <TwitterBird />
      </a>
    </div>
  );
};

export default Market;
