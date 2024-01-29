import { Disclosure, Transition } from "@headlessui/react";
import {
  FullMarketFragment,
  MarketStatus,
  ScoringRule,
} from "@zeitgeistpm/indexer";
import {
  MarketOutcomeAssetId,
  ScalarRangeType,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import LatestTrades from "components/front-page/LatestTrades";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import DisputeResult from "components/markets/DisputeResult";
import { AddressDetails } from "components/markets/MarketAddresses";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import {
  CategoricalMarketChart,
  ScalarMarketChart,
} from "components/markets/MarketChart";
import { MarketDescription } from "components/markets/MarketDescription";
import MarketHeader from "components/markets/MarketHeader";
import PoolDeployer from "components/markets/PoolDeployer";
import ReportResult from "components/markets/ReportResult";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import MarketMeta from "components/meta/MarketMeta";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";
import CategoricalReportBox from "components/outcomes/CategoricalReportBox";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import ReferendumSummary from "components/ui/ReferendumSummary";
import Skeleton from "components/ui/Skeleton";
import { ChartSeries } from "components/ui/TimeSeriesChart";
import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import {
  CmsMarketMetadata,
  getCmsMarketMetadataForMarket,
} from "lib/cms/markets";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { ZTG, environment, graphQlEndpoint } from "lib/constants";
import {
  MarketPageIndexedData,
  getMarket,
  getRecentMarketIds,
} from "lib/gql/markets";
import { getResolutionTimestamp } from "lib/gql/resolution-date";
import { useMarketCaseId } from "lib/hooks/queries/court/useMarketCaseId";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketPoolId } from "lib/hooks/queries/useMarketPoolId";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useTradeItem } from "lib/hooks/trade";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useWallet } from "lib/state/wallet";
import {
  MarketCategoricalOutcome,
  MarketReport,
  MarketScalarOutcome,
  isMarketCategoricalOutcome,
  isValidMarketReport,
} from "lib/types";
import { MarketDispute } from "lib/types/markets";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, X } from "react-feather";
import { AiOutlineFileAdd } from "react-icons/ai";
import { FaChevronUp } from "react-icons/fa";

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

  const [
    market,
    cmsMetadata,
    // promotionData
  ] = await Promise.all([
    getMarket(client, params.marketid),
    getCmsMarketMetadataForMarket(params.marketid),
    // getMarketPromotion(Number(params.marketid)),
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

    if (cmsMetadata?.imageUrl) market.img = cmsMetadata?.imageUrl;
    if (cmsMetadata?.question) market.question = cmsMetadata?.question;
    if (cmsMetadata?.description) market.description = cmsMetadata?.description;
  }

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      resolutionTimestamp: resolutionTimestamp ?? null,
      promotionData: null,
      cmsMetadata: cmsMetadata ?? null,
    },
    revalidate:
      environment === "production"
        ? 5 * 60 //5min
        : 60 * 60,
  };
}

type MarketPageProps = {
  indexedMarket: MarketPageIndexedData;
  chartSeries: ChartSeries[];
  resolutionTimestamp: string;
  promotionData: PromotedMarket | null;
  cmsMetadata: CmsMarketMetadata | null;
};

const Market: NextPage<MarketPageProps> = ({
  indexedMarket,
  chartSeries,
  resolutionTimestamp,
  promotionData,
  cmsMetadata,
}) => {
  const router = useRouter();
  const { marketid } = router.query;
  const marketId = Number(marketid);

  const referendumChain = cmsMetadata?.referendumRef?.chain;
  const referendumIndex = cmsMetadata?.referendumRef?.referendumIndex;

  const tradeItem = useTradeItem();

  const outcomeAssets = indexedMarket?.outcomeAssets?.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );

  useEffect(() => {
    tradeItem.set({
      assetId: outcomeAssets[0],
      action: "buy",
    });
  }, [marketId]);

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

  const token = metadata?.symbol;

  const isOracle = market?.oracle === wallet.realAddress;
  const canReport =
    marketStage?.type === "OpenReportingPeriod" ||
    (marketStage?.type === "OracleReportingPeriod" && isOracle);

  const lastDispute = useMemo(() => {
    if (disputes && market?.status === "Disputed") {
      const lastDispute = disputes?.[disputes.length - 1];
      const at = lastDispute?.at!;
      const by = lastDispute?.by!;

      const marketDispute: MarketDispute = {
        at,
        by,
      };

      return marketDispute;
    }
  }, [market?.report, disputes]);

  const report = useMemo(() => {
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
      return report;
    }
  }, [market?.report, disputes]);

  if (indexedMarket == null) {
    return <NotFoundPage backText="Back To Markets" backLink="/" />;
  }

  const marketHasPool =
    (market?.scoringRule === ScoringRule.Cpmm &&
      poolId != null &&
      poolIdLoading === false) ||
    (market?.scoringRule === ScoringRule.Lmsr && market.neoPool != null);

  const poolCreationDate = new Date(
    indexedMarket.pool?.createdAt ?? indexedMarket.neoPool?.createdAt ?? "",
  );
  return (
    <div className="mt-6">
      <div className="relative flex flex-auto gap-12">
        <div className="flex-1">
          <MarketMeta market={indexedMarket} />

          <MarketHeader
            market={indexedMarket}
            resolvedOutcome={market?.resolvedOutcome ?? undefined}
            report={report}
            disputes={lastDispute}
            token={token}
            marketStage={marketStage ?? undefined}
            promotionData={promotionData}
            rejectReason={market?.rejectReason ?? undefined}
          />

          {market?.rejectReason && market.rejectReason.length > 0 && (
            <div className="mt-[10px] text-ztg-14-150">
              Market rejected: {market.rejectReason}
            </div>
          )}

          {chartSeries && (indexedMarket?.pool || indexedMarket.neoPool) ? (
            <div className="mt-4">
              {indexedMarket.scalarType === "number" ? (
                <ScalarMarketChart
                  marketId={indexedMarket.marketId}
                  poolCreationDate={poolCreationDate}
                  marketStatus={indexedMarket.status}
                  resolutionDate={new Date(resolutionTimestamp)}
                />
              ) : (
                <CategoricalMarketChart
                  marketId={indexedMarket.marketId}
                  chartSeries={chartSeries}
                  baseAsset={
                    indexedMarket.pool?.baseAsset ??
                    indexedMarket.neoPool?.collateral
                  }
                  poolCreationDate={poolCreationDate}
                  marketStatus={indexedMarket.status}
                  resolutionDate={new Date(resolutionTimestamp)}
                />
              )}
            </div>
          ) : (
            <></>
          )}
          {marketIsLoading === false && marketHasPool === false && (
            <div className="flex h-ztg-22 items-center rounded-ztg-5 bg-vermilion-light p-ztg-20 text-vermilion">
              <div className="h-ztg-20 w-ztg-20">
                <AlertTriangle size={20} />
              </div>
              <div
                className="ml-ztg-10 text-ztg-12-120 "
                data-test="liquidityPoolMessage"
              >
                This market doesn't have a liquidity pool and therefore cannot
                be traded
              </div>
            </div>
          )}
          <div className="my-8">
            {indexedMarket?.marketType?.scalar !== null && (
              <div className="mx-auto mb-8 max-w-[800px]">
                {marketIsLoading ||
                (!spotPrices?.get(1) && indexedMarket.status !== "Proposed") ||
                (!spotPrices?.get(0) && indexedMarket.status !== "Proposed") ? (
                  <Skeleton height="40px" width="100%" />
                ) : (
                  <ScalarPriceRange
                    className="rounded-lg"
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

          <div className="mb-12 max-w-[90vw]">
            <MarketDescription market={indexedMarket} />
          </div>

          <AddressDetails title="Oracle" address={indexedMarket.oracle} />
          {marketHasPool === true && (
            <div className="mt-10 flex flex-col gap-4">
              <h3 className="mb-5 text-2xl">Latest Trades</h3>
              <LatestTrades limit={3} marketId={marketId} />
              <Link
                className="w-full text-center text-ztg-blue"
                href={`/latest-trades?marketId=${marketId}`}
              >
                View more
              </Link>
            </div>
          )}

          {marketHasPool === false && (
            <PoolDeployer
              marketId={marketId}
              onPoolDeployed={handlePoolDeployed}
            />
          )}

          {market && (marketHasPool || poolDeployed) && (
            <div className="my-12">
              <div
                className="mb-8 flex cursor-pointer items-center text-mariner"
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
                show={showLiquidity && Boolean(marketHasPool || poolDeployed)}
              >
                <MarketLiquiditySection poll={poolDeployed} market={market} />
              </Transition>
            </div>
          )}
        </div>

        <div className="hidden md:-mr-6 md:block md:w-[320px] lg:mr-auto lg:w-[460px]">
          <div className="sticky top-28">
            <div className="mb-12 animate-pop-in rounded-lg opacity-0 shadow-lg">
              {market?.status === MarketStatus.Active ? (
                <>
                  <Amm2TradeForm marketId={marketId} />
                </>
              ) : market?.status === MarketStatus.Closed && canReport ? (
                <>
                  <ReportForm market={market} />
                </>
              ) : market?.status === MarketStatus.Reported ? (
                <>
                  <DisputeForm market={market} />
                </>
              ) : market?.status === MarketStatus.Disputed &&
                market?.disputeMechanism === "Court" ? (
                <CourtCaseContext market={market} />
              ) : (
                <></>
              )}
            </div>
            {referendumIndex != null && (
              <div className="mb-12 animate-pop-in opacity-0">
                <ReferendumSummary referendumIndex={referendumIndex} />
              </div>
            )}
            <SimilarMarketsSection market={market ?? undefined} />
          </div>
        </div>
      </div>
      {market && <MobileContextButtons market={market} />}
    </div>
  );
};

const MobileContextButtons = ({ market }: { market: FullMarketFragment }) => {
  const wallet = useWallet();

  const { data: marketStage } = useMarketStage(market);
  const isOracle = market?.oracle === wallet.realAddress;
  const canReport =
    marketStage?.type === "OpenReportingPeriod" ||
    (marketStage?.type === "OracleReportingPeriod" && isOracle);

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );

  const { data: tradeItem, set: setTradeItem } = useTradeItem();

  const [open, setOpen] = useState(false);

  return (
    <>
      <Transition
        show={open}
        enter="transition-opacity ease-in-out duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in-out duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="fixed left-0 top-0 h-full w-full"
      >
        <div
          onClick={() => setOpen(false)}
          className="fixed left-0 top-0 z-40 h-full w-full bg-black/20 md:hidden"
        />
      </Transition>

      <div
        className={`fixed bottom-20 left-0 z-50 w-full rounded-t-lg bg-white pb-12 transition-all duration-500 ease-in-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {market?.status === MarketStatus.Active ? (
          <Amm2TradeForm
            marketId={market.marketId}
            showTabs={false}
            selectedTab={
              tradeItem?.action === "buy" ? TradeTabType.Buy : TradeTabType.Sell
            }
          />
        ) : market?.status === MarketStatus.Closed && canReport ? (
          <>
            <ReportForm market={market} />
          </>
        ) : market?.status === MarketStatus.Reported ? (
          <>
            <DisputeForm market={market} />
          </>
        ) : (
          <></>
        )}
      </div>

      {(market?.status === MarketStatus.Active ||
        market?.status === MarketStatus.Closed ||
        market?.status === MarketStatus.Reported) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="flex h-20 cursor-pointer text-lg font-semibold">
            {market?.status === MarketStatus.Active ? (
              <>
                <div
                  className={`center h-full flex-1  ${
                    tradeItem?.action === "buy"
                      ? "bg-fog-of-war text-gray-200"
                      : "bg-white text-black"
                  } `}
                  onClick={() => {
                    setTradeItem({
                      assetId: tradeItem?.assetId ?? outcomeAssets[0],
                      action: "buy",
                    });
                    if (open && tradeItem?.action === "buy") {
                      setOpen(false);
                    } else {
                      setOpen(true);
                    }
                  }}
                >
                  Buy{" "}
                  <X
                    className={`center h-full w-0 transition-all  ${
                      open && tradeItem?.action === "buy" && "w-6"
                    }`}
                  />
                </div>
                <div
                  className={`center h-full flex-1 ${
                    tradeItem?.action === "sell"
                      ? "bg-fog-of-war text-gray-200"
                      : "bg-white text-black"
                  }`}
                  onClick={() => {
                    setTradeItem({
                      assetId: tradeItem?.assetId ?? outcomeAssets[0],
                      action: "sell",
                    });
                    if (open && tradeItem?.action === "sell") {
                      setOpen(false);
                    } else {
                      setOpen(true);
                    }
                  }}
                >
                  Sell
                  <X
                    className={`center h-full w-0 transition-all  ${
                      open && tradeItem?.action === "sell" && "w-6"
                    }`}
                  />
                </div>
              </>
            ) : market?.status === MarketStatus.Closed && canReport ? (
              <>
                <div
                  className={`center h-full flex-1 transition-all ${
                    !open ? "bg-ztg-blue text-white" : "bg-slate-200"
                  }`}
                  onClick={() => setOpen(!open)}
                >
                  {open ? <X /> : "Report"}
                </div>
              </>
            ) : market?.status === MarketStatus.Reported ? (
              <div
                className={`center h-full flex-1 ${
                  !open ? "bg-ztg-blue text-white" : "bg-slate-200"
                }`}
                onClick={() => setOpen(!open)}
              >
                {open ? <X /> : "Dispute"}
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const DisputeForm = ({ market }: { market: FullMarketFragment }) => {
  const reportedOutcome = market.report?.outcome;

  const [hasReportedDispute, setHasReportedDispute] = useState(false);

  return (
    <div className="relative">
      {hasReportedDispute ? (
        <DisputeResult market={market} />
      ) : (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button
                className={`relative z-20 flex w-full items-center rounded-md px-5 py-2 ${
                  !open && "bg-orange-400 "
                }`}
              >
                <h3
                  className={`flex-1 text-left text-base ${
                    open ? "opacity-0" : "text-white opacity-100"
                  }`}
                >
                  Market can be disputed
                </h3>
                {open ? (
                  <X />
                ) : (
                  <FaChevronUp
                    size={18}
                    className={`justify-end text-gray-600 ${
                      !open && "rotate-180 text-white"
                    }`}
                  />
                )}
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
                className="relative z-10 -mt-[30px]"
              >
                <Disclosure.Panel>
                  {isMarketCategoricalOutcome(reportedOutcome) ? (
                    <CategoricalDisputeBox
                      market={market}
                      onSuccess={() => setHasReportedDispute(true)}
                    />
                  ) : (
                    <ScalarDisputeBox
                      market={market}
                      onSuccess={() => setHasReportedDispute(true)}
                    />
                  )}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}
    </div>
  );
};

const ReportForm = ({ market }: { market: FullMarketFragment }) => {
  const [reportedOutcome, setReportedOutcome] = useState<
    | MarketCategoricalOutcome
    | (MarketScalarOutcome & { type: ScalarRangeType })
    | undefined
  >();

  const wallet = useWallet();
  const { data: stage } = useMarketStage(market);
  const { data: chainConstants } = useChainConstants();

  const connectedWalletIsOracle = market.oracle === wallet.realAddress;

  const userCanReport =
    stage?.type === "OpenReportingPeriod" || connectedWalletIsOracle;

  return !userCanReport ? (
    <></>
  ) : (
    <div className="px-5 py-10">
      {reportedOutcome ? (
        <ReportResult market={market} outcome={reportedOutcome} />
      ) : (
        <>
          <h4 className="mb-4 flex items-center gap-2">
            <AiOutlineFileAdd size={20} className="text-gray-600" />
            <span>Report Market Outcome</span>
          </h4>

          <p className="mb-6 text-sm">
            Market has closed and the outcome can now be reported.
          </p>

          {stage?.type === "OpenReportingPeriod" && (
            <>
              <p className="-mt-3 mb-6 text-sm italic text-gray-500">
                Oracle failed to report. Reporting is now open to all.
              </p>
              <p className="mb-6 text-sm">
                Bond cost: {chainConstants?.markets.outsiderBond}{" "}
                {chainConstants?.tokenSymbol}
              </p>
            </>
          )}

          <div className="mb-4">
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

const CourtCaseContext = ({ market }: { market: FullMarketFragment }) => {
  const { data: caseId, isFetched } = useMarketCaseId(market.marketId);
  const router = useRouter();

  return (
    <div className="px-5 py-8">
      <h4 className="mb-3 flex items-center gap-2">
        <Image width={22} height={22} src="/icons/court.svg" alt="court" />
        <span>Market Court Case</span>
      </h4>

      <p className="mb-5 text-sm">
        Market has been disputed and is awaiting a ruling in court.
      </p>

      <button
        disabled={!isFetched}
        onClick={() => router.push(`/court/${caseId}`)}
        onMouseEnter={() => router.prefetch(`/court/${caseId}`)}
        className={`ztg-transition h-[56px] w-full rounded-full bg-purple-400 text-white focus:outline-none disabled:cursor-default disabled:bg-slate-300`}
      >
        View Case
      </button>
    </div>
  );
};

export default Market;
