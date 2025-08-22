import { useQuery } from "@tanstack/react-query";
import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import {
  MarketOutcomeAssetId,
  ScalarRangeType,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import { from } from "@zeitgeistpm/utility/dist/aeither";
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
import OrdersTable from "components/orderbook/OrdersTable";
import CategoricalDisputeBox from "components/outcomes/CategoricalDisputeBox";
import CategoricalReportBox from "components/outcomes/CategoricalReportBox";
import ScalarDisputeBox from "components/outcomes/ScalarDisputeBox";
import ScalarReportBox from "components/outcomes/ScalarReportBox";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import ReferendumSummary from "components/ui/ReferendumSummary";
import Skeleton from "components/ui/Skeleton";
import { ChartSeries } from "components/ui/TimeSeriesChart";
import Toggle from "components/ui/Toggle";
import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import {
  FullCmsMarketMetadata,
  getCmsFullMarketMetadataForMarket,
} from "lib/cms/markets";
import { ZTG, environment, graphQlEndpoint } from "lib/constants";
import {
  MarketPageIndexedData,
  WithCmsEdits,
  getMarket,
  getRecentMarketIds,
} from "lib/gql/markets";
import { getResolutionTimestamp } from "lib/gql/resolution-date";
import { useMarketCaseId } from "lib/hooks/queries/court/useMarketCaseId";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
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
import { extractChannelName, isLive } from "lib/twitch";
import {
  MarketCategoricalOutcome,
  MarketReport,
  MarketScalarOutcome,
  isMarketCategoricalOutcome,
  isValidMarketReport,
} from "lib/types";
import { MarketDispute } from "lib/types/markets";
import { parseAssetIdString, parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, X } from "react-feather";
import { AiOutlineFileAdd } from "react-icons/ai";
import { BsFillChatSquareTextFill } from "react-icons/bs";
import { CgLivePhoto } from "react-icons/cg";
import { FaChevronUp, FaTwitch } from "react-icons/fa";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { filterMarketRelevantAssets } from "lib/util/filter-market-assets";
import { calcMarketColors } from "lib/util/color-calc";
import { Disclosure, Tab, Transition } from "@headlessui/react";
import { CombinatorialToken } from "lib/types/combinatorial";

const TradeForm = dynamic(() => import("../../components/trade-form"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "606px" }} />,
});

const TwitchPlayer = dynamic(
  () => import("../../components/twitch/TwitchPlayer"),
  {
    ssr: false,
    loading: () => <div style={{ width: "100%", height: "606px" }} />,
  },
);

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

  const [market, cmsMetadata] = await Promise.all([
    getMarket(client, params.marketid),
    getCmsFullMarketMetadataForMarket(params.marketid),
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

    if (cmsMetadata?.question || cmsMetadata?.description) {
      market.hasEdits = true;
      (market as MarketPageIndexedData & WithCmsEdits).originalMetadata = {};
    }

    if (cmsMetadata?.imageUrl) {
      market.img = cmsMetadata?.imageUrl;
    }

    if (cmsMetadata?.question) {
      (
        market as MarketPageIndexedData & WithCmsEdits
      ).originalMetadata.question = market.question;
      market.question = cmsMetadata?.question;
    }

    if (cmsMetadata?.description) {
      (
        market as MarketPageIndexedData & WithCmsEdits
      ).originalMetadata.description = market.description as string;
      market.description = cmsMetadata?.description;
    }
  }

  const hasLiveTwitchStream = await from(async () => {
    const channelName = extractChannelName(cmsMetadata?.twitchStreamUrl);
    if (channelName) {
      return await isLive(channelName);
    }
    return false;
  });

  return {
    props: {
      indexedMarket: market ?? null,
      chartSeries: chartSeries ?? null,
      resolutionTimestamp: resolutionTimestamp ?? null,
      promotionData: null,
      cmsMetadata: cmsMetadata ?? null,
      hasLiveTwitchStream: hasLiveTwitchStream,
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
  cmsMetadata: FullCmsMarketMetadata | null;
  hasLiveTwitchStream: boolean;
};

const Market: NextPage<MarketPageProps> = ({
  indexedMarket,
  chartSeries,
  resolutionTimestamp,
  promotionData,
  cmsMetadata,
  hasLiveTwitchStream: hasLiveTwitchStreamServer,
}) => {
  const router = useRouter();
  const { marketid } = router.query;
  
  const marketId = indexedMarket?.marketId ?? (router.isReady ? Number(marketid) : undefined);
  const { realAddress } = useWallet();
  const marketData = indexedMarket;

  const { data: poolData } = useAmm2Pool(
    marketId || 0, 
    marketData?.neoPool?.poolId ?? null
  );

  const { data: orders, isLoading: isOrdersLoading } = useOrders({
    marketId_eq: marketId,
    makerAccountId_eq: realAddress,
  });

  const referendumIndex = cmsMetadata?.referendumRef?.referendumIndex;

  const tradeItem = useTradeItem();

  if (!marketData) {
    return <NotFoundPage backText="Back To Markets" backLink="/" />;
  }

  const outcomeAssets = marketData?.outcomeAssets?.map(
    (assetIdString) =>
      parseAssetIdStringWithCombinatorial(assetIdString),
  );

  // Filter pool assets to match the market's specific outcomes
  const relevantPoolAssets: (MarketOutcomeAssetId | CombinatorialToken)[] | undefined = useMemo(() => {
    // Fallback: If pool data is not available but we have outcome assets, use them
    if (!poolData?.assetIds && outcomeAssets && outcomeAssets.length > 0) {
      console.log('[Using Fallback Assets]', { 
        outcomeAssetsLength: outcomeAssets.length,
        reason: 'Pool data unavailable'
      });
      return outcomeAssets;
    }
    
    // If pool data is not available, return undefined
    if (!poolData?.assetIds) return undefined;
    
    // Check if this is a combo pool
    const isComboPool = poolData.assetIds.some(isCombinatorialToken);
    
    if (!isComboPool) {
      // Regular pool - return all assets
      return poolData.assetIds;
    }
    
    // Combo pool - need to determine if this is a regular market or combo market
    if (!marketData?.outcomeAssets || !outcomeAssets) {
      return poolData.assetIds;
    }
    
    const marketAssetStrings = marketData.outcomeAssets;
    
    // Check if market has categorical outcomes (regular market using combo pool)
    const hasCategorialOutcomes = marketAssetStrings.some((assetString: string) => 
      assetString.includes('categoricalOutcome')
    );
    
    if (hasCategorialOutcomes) {
      // Regular market using combo pool - take first N combo tokens
      const comboTokens = poolData.assetIds.filter(isCombinatorialToken);
      return comboTokens.slice(0, outcomeAssets.length);
    }
    
    // True combo market - try to match tokens
    const filtered = poolData.assetIds.filter(poolAsset => {
      if (isCombinatorialToken(poolAsset)) {
        const hasMatch = marketAssetStrings.some((marketAssetString: string) => 
          marketAssetString.includes(poolAsset.CombinatorialToken)
        );
        return hasMatch;
      } else {
        const poolAssetString = JSON.stringify(poolAsset);
        const hasMatch = marketAssetStrings.some((marketAssetString: string) => 
          marketAssetString === poolAssetString
        );
        return hasMatch;
      }
    });
    
    // If filtering removed everything, return all non-combo assets as fallback
    if (filtered.length === 0) {
      return poolData.assetIds.filter(asset => !isCombinatorialToken(asset));
    }
    
    return filtered;
  }, [poolData?.assetIds, outcomeAssets, marketData?.outcomeAssets]);


  // Set initial trade item when market loads
  useEffect(() => {
    if (outcomeAssets && outcomeAssets.length > 0 && marketId) {
      tradeItem.set({
        assetId: outcomeAssets[0],
        action: "buy",
      });
    }
  }, [marketId]); // Only depend on marketId to avoid re-setting on every render

  const [showLiquidityParam, setShowLiquidityParam, unsetShowLiquidityParam] =
    useQueryParamState("showLiquidity");

  const showLiquidity = showLiquidityParam != null;

  const [poolDeployed, setPoolDeployed] = useState(false);

  const { data: market, isLoading: marketIsLoading, refetch: refetchMarket } = useMarket(
    marketId ? { marketId } : undefined,
    {
      refetchInterval: poolDeployed ? 1000 : false,
    },
  );

  const { data: disputes } = useMarketDisputes(marketId || 0);

  const { data: marketStage } = useMarketStage(market ?? undefined);
  const { data: spotPrices, refetch: refetchSpotPrices } = useMarketSpotPrices(marketId || 0);

  const baseAsset = parseAssetIdString(marketData?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAsset);

  const [showTwitchChat, setShowTwitchChat] = useState(true);

  const wallet = useWallet();
  
  // Market pool status - must be declared early for use in JSX
  // Use static data if available, fallback to dynamic data
  const marketHasPool = (marketData?.neoPool != null) || (market?.neoPool != null);
  

  const handlePoolDeployed = () => {
    setPoolDeployed(true);
    setShowLiquidityParam("");
    // Refetch market data after pool deployment
    refetchMarket();
    refetchSpotPrices();
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

  const hasChart = Boolean(
    chartSeries && (marketData?.pool || marketData.neoPool),
  );

  const twitchStreamChannelName = extractChannelName(
    cmsMetadata?.twitchStreamUrl,
  );

  const hasTwitchStream = Boolean(twitchStreamChannelName);

  const activeTabsCount = [hasChart, hasTwitchStream].filter(Boolean).length;

  const { data: hasLiveTwitchStreamClient } = useQuery({
    queryKey: ["twitch-stream", twitchStreamChannelName],
    queryFn: async () => {
      if (!twitchStreamChannelName) return undefined;
      return isLive(twitchStreamChannelName);
    },
    enabled: Boolean(hasTwitchStream),
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: false,
    initialData: hasLiveTwitchStreamServer,
  });

  const hasLiveTwitchStream =
    hasLiveTwitchStreamClient || hasLiveTwitchStreamServer;

  const poolCreationDate = new Date(
    marketData.pool?.createdAt ?? marketData.neoPool?.createdAt ?? "",
  );
  
  // Generate outcomeCombinations for regular markets using combo pools
  const outcomeCombinations = useMemo(() => {
    // Use available data - prefer market data but fallback to marketData (static props)
    const categories = market?.categories || marketData?.categories;
    const marketIdValue = market?.marketId || marketData?.marketId;
    
    if (!relevantPoolAssets || !categories || !marketIdValue) return undefined;
    
    // Only generate for markets that have combinatorial tokens but are regular markets
    const hasComboTokens = relevantPoolAssets.some(isCombinatorialToken);
    if (!hasComboTokens) return undefined;
    
    const colors = calcMarketColors(marketIdValue, relevantPoolAssets.length);
    
    return relevantPoolAssets
      .filter(isCombinatorialToken)
      .map((asset, index) => {
        const categoryIndex = index < categories.length ? index : 0;
        return {
          assetId: asset,
          name: categories[categoryIndex]?.name || `Outcome ${index}`,
          color: categories[categoryIndex]?.color || colors[index],
        };
      });
  }, [relevantPoolAssets, market?.categories, market?.marketId, marketData?.categories, marketData?.marketId]);

  return (
    <div className="mt-6">
      <div className="relative flex flex-auto gap-12">
        <div className="flex-1 overflow-hidden">
          <MarketMeta market={marketData} />

          <MarketHeader
            market={marketData}
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

          <div className="mt-4">
            <Tab.Group defaultIndex={hasLiveTwitchStream ? 1 : 0}>
              <Tab.List
                className={`flex gap-2 text-sm ${
                  activeTabsCount < 2 ? "hidden" : ""
                }`}
              >
                <Tab
                  key="chart"
                  className="rounded-md border-1 border-gray-400 px-2 py-1 ui-selected:border-transparent ui-selected:bg-gray-300"
                >
                  Chart
                </Tab>

                <Tab
                  key="twitch"
                  className="flex items-center gap-2 rounded-md border-1 border-twitch-purple px-2 py-1 text-twitch-purple ui-selected:border-transparent ui-selected:bg-twitch-purple ui-selected:text-twitch-gray"
                >
                  <FaTwitch size={16} />
                  Twitch Stream
                  {hasLiveTwitchStream && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <div className="animate-pulse-scale">
                        <CgLivePhoto />
                      </div>
                      Live!
                    </div>
                  )}
                </Tab>
                <div className="flex flex-1 items-center">
                  <div className="ml-auto flex items-center gap-1">
                    <Toggle
                      className="w-6"
                      checked={showTwitchChat}
                      onChange={(checked) => {
                        setShowTwitchChat(checked);
                      }}
                      activeClassName="bg-twitch-purple"
                    />
                    <BsFillChatSquareTextFill
                      size={18}
                      className={
                        showTwitchChat ? "text-twitch-purple" : "text-gray-400"
                      }
                    />
                  </div>
                </div>
              </Tab.List>

              <Tab.Panels className="mt-2">
                {hasChart ? (
                  <Tab.Panel key="chart">
                    {marketData.scalarType === "number" ? (
                      <ScalarMarketChart
                        marketId={marketData.marketId}
                        poolCreationDate={poolCreationDate}
                        marketStatus={marketData.status}
                        resolutionDate={new Date(resolutionTimestamp)}
                      />
                    ) : (
                      <CategoricalMarketChart
                        marketId={marketData.marketId}
                        chartSeries={chartSeries}
                        baseAsset={
                          marketData.pool?.baseAsset ??
                          marketData.neoPool?.collateral
                        }
                        poolCreationDate={poolCreationDate}
                        marketStatus={marketData.status}
                        resolutionDate={new Date(resolutionTimestamp)}
                      />
                    )}
                  </Tab.Panel>
                ) : (
                  <></>
                )}

                {hasTwitchStream && twitchStreamChannelName ? (
                  <Tab.Panel key="twitch">
                    <div className="h-[500px]">
                      <TwitchPlayer
                        channel={twitchStreamChannelName}
                        autoplay
                        muted
                        withChat={showTwitchChat}
                        darkMode={false}
                        hideControls={false}
                        width={"100%"}
                        height={"100%"}
                      />
                    </div>
                  </Tab.Panel>
                ) : (
                  <></>
                )}
              </Tab.Panels>
            </Tab.Group>
          </div>
          {realAddress &&
            isOrdersLoading === false &&
            (orders?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-col gap-y-3">
                <div>My Orders</div>
                <OrdersTable
                  where={{
                    marketId_eq: marketId,
                    makerAccountId_eq: realAddress,
                  }}
                />
              </div>
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
            {marketData?.marketType?.scalar !== null && (
              <div className="mx-auto mb-8 max-w-[800px]">
                {marketIsLoading ||
                (!spotPrices?.get(1) && marketData.status !== "Proposed") ||
                (!spotPrices?.get(0) && marketData.status !== "Proposed") ? (
                  <Skeleton height="40px" width="100%" />
                ) : (
                  <ScalarPriceRange
                    className="rounded-lg"
                    scalarType={marketData.scalarType}
                    lowerBound={new Decimal(marketData.marketType.scalar[0])
                      .div(ZTG)
                      .toNumber()}
                    upperBound={new Decimal(marketData.marketType.scalar[1])
                      .div(ZTG)
                      .toNumber()}
                    shortPrice={spotPrices?.get(1)?.toNumber()}
                    longPrice={spotPrices?.get(0)?.toNumber()}
                    status={marketData.status}
                  />
                )}
              </div>
            )}
            <MarketAssetDetails
              marketId={marketId ?? 0}
              categories={marketData.categories}
            />
          </div>

          <div className="mb-12 max-w-[90vw]">
            <MarketDescription market={marketData} />
          </div>

          <AddressDetails title="Oracle" address={marketData.oracle} />
          {marketHasPool === true && (
            <div className="mt-10 flex flex-col gap-4">
              <h3 className="mb-5 text-2xl">Latest Trades</h3>
              <LatestTrades 
                limit={3} 
                marketId={marketId} 
                outcomeAssets={(() => {
                  if (!relevantPoolAssets?.some(isCombinatorialToken)) return undefined;
                  
                  const comboAssets = relevantPoolAssets.filter(isCombinatorialToken);
                  
                  // Apply consistent ordering to match market.outcomeAssets
                  if (!marketData?.outcomeAssets) return comboAssets;
                  
                  return comboAssets.sort((a, b) => {
                    const aIndex = marketData.outcomeAssets.findIndex(marketAsset => {
                      if (typeof marketAsset === 'string' && marketAsset.includes(a.CombinatorialToken)) {
                        return true;
                      }
                      return JSON.stringify(marketAsset).includes(a.CombinatorialToken);
                    });
                    
                    const bIndex = marketData.outcomeAssets.findIndex(marketAsset => {
                      if (typeof marketAsset === 'string' && marketAsset.includes(b.CombinatorialToken)) {
                        return true;
                      }
                      return JSON.stringify(marketAsset).includes(b.CombinatorialToken);
                    });
                    
                    return aIndex - bIndex;
                  });
                })()}
                outcomeNames={
                  relevantPoolAssets?.some(isCombinatorialToken)
                    ? marketData?.categories?.map(cat => cat.name)
                    : undefined
                }
              />
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
                <MarketLiquiditySection pool={poolDeployed} market={market} comboMarket={false}/>
              </Transition>
            </div>
          )}
        </div>

        <div className="hidden md:-mr-6 md:block md:w-[320px] lg:mr-auto lg:w-[460px]">
          <div className="sticky top-28">
            <div
              className="mb-12 animate-pop-in rounded-lg  opacity-0 shadow-lg"
              style={{
                background:
                  "linear-gradient(180deg, rgba(49, 125, 194, 0.2) 0%, rgba(225, 210, 241, 0.2) 100%)",
              }}
            >
              {(market?.status === MarketStatus.Active || marketData?.status === "Active") ? (
                <>
                  <Amm2TradeForm 
                    marketId={marketId} 
                    filteredAssets={relevantPoolAssets}
                    outcomeCombinations={outcomeCombinations}
                  />
                </>
              ) : (market?.status === MarketStatus.Closed || marketData?.status === "Closed") && canReport && market ? (
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
      {(market || marketData) && (
        <MobileContextButtons 
          market={market} 
          relevantPoolAssets={relevantPoolAssets}
          marketData={marketData}
        />
      )}
    </div>
  );
};

const MobileContextButtons = ({ 
  market, 
  relevantPoolAssets,
  marketData
}: { 
  market: FullMarketFragment | null | undefined;
  relevantPoolAssets?: (MarketOutcomeAssetId | CombinatorialToken)[];
  marketData?: any; // Allow any type for marketData since it comes from static props
}) => {
  const wallet = useWallet();

  const { data: marketStage } = useMarketStage(market ?? undefined);
  const isOracle = market?.oracle === wallet.realAddress;
  const canReport =
    marketStage?.type === "OpenReportingPeriod" ||
    (marketStage?.type === "OracleReportingPeriod" && isOracle);

  const outcomeAssets = (market?.outcomeAssets || marketData?.outcomeAssets || []).map(
    (assetIdString: string) =>
      parseAssetIdStringWithCombinatorial(assetIdString),
  );

  const { data: tradeItem, set: setTradeItem } = useTradeItem();

  const [open, setOpen] = useState(false);

  // Generate outcomeCombinations for regular markets using combo pools
  const outcomeCombinations = useMemo(() => {
    // Use available categories data
    const categories = market?.categories;
    const marketIdValue = market?.marketId;
    
    if (!relevantPoolAssets || !categories || !marketIdValue) return undefined;
    
    // Only generate for markets that have combinatorial tokens but are regular markets
    const hasComboTokens = relevantPoolAssets.some(isCombinatorialToken);
    if (!hasComboTokens) return undefined;
    
    const colors = calcMarketColors(marketIdValue, relevantPoolAssets.length);
    
    return relevantPoolAssets
      .filter(isCombinatorialToken)
      .map((asset, index) => {
        const categoryIndex = index < categories.length ? index : 0;
        return {
          assetId: asset,
          name: categories[categoryIndex]?.name || `Outcome ${index}`,
          color: categories[categoryIndex]?.color || colors[index],
        };
      });
  }, [relevantPoolAssets, market?.categories, market?.marketId]);

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
        {(market?.status === MarketStatus.Active || marketData?.status === "Active") ? (
          <Amm2TradeForm
            marketId={market?.marketId || marketData?.marketId || 0}
            showTabs={false}
            selectedTab={
              tradeItem?.action === "buy" ? TradeTabType.Buy : TradeTabType.Sell
            }
            filteredAssets={relevantPoolAssets}
            outcomeCombinations={outcomeCombinations}
          />
        ) : (market?.status === MarketStatus.Closed || marketData?.status === "Closed") && canReport ? (
          <>
            <ReportForm market={market!} />
          </>
        ) : market?.status === MarketStatus.Reported ? (
          <>
            <DisputeForm market={market} />
          </>
        ) : (
          <></>
        )}
      </div>

      {((market?.status === MarketStatus.Active || marketData?.status === "Active") ||
        (market?.status === MarketStatus.Closed || marketData?.status === "Closed") ||
        (market?.status === MarketStatus.Reported || marketData?.status === "Reported")) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="flex h-20 cursor-pointer text-lg font-semibold">
            {(market?.status === MarketStatus.Active || marketData?.status === "Active") ? (
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
