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
import {
  parseAssetIdString,
  parseAssetIdStringWithCombinatorial,
} from "lib/util/parse-asset-id";
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

  // Prioritize URL parameter over static props to ensure correct data on navigation
  const marketId =
    router.isReady && marketid ? Number(marketid) : indexedMarket?.marketId;
  const { realAddress } = useWallet();
  const marketData = indexedMarket;

  const [poolDeployed, setPoolDeployed] = useState(false);

  // Fetch fresh market data when navigating between markets
  const {
    data: market,
    isLoading: marketIsLoading,
    refetch: refetchMarket,
  } = useMarket(marketId ? { marketId } : undefined, {
    refetchInterval: poolDeployed ? 1000 : false,
  });

  const { data: poolData } = useAmm2Pool(
    marketId || 0,
    market?.neoPool?.poolId ?? marketData?.neoPool?.poolId ?? null,
    market || marketData,
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

  const outcomeAssets = marketData?.outcomeAssets?.map((assetIdString) =>
    parseAssetIdStringWithCombinatorial(assetIdString),
  );

  // Filter pool assets to match the market's specific outcomes
  const relevantPoolAssets:
    | (MarketOutcomeAssetId | CombinatorialToken)[]
    | undefined = useMemo(() => {
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
    const hasCategorialOutcomes = marketAssetStrings.some(
      (assetString: string) => assetString.includes("categoricalOutcome"),
    );

    if (hasCategorialOutcomes) {
      // Regular market using combo pool - need to match combo tokens to market.outcomeAssets order
      const comboTokens = poolData.assetIds.filter(isCombinatorialToken);

      // Sort combo tokens to match the order in market.outcomeAssets
      const sortedTokens: CombinatorialToken[] = [];
      for (const marketAsset of marketAssetStrings) {
        // Parse the market asset to get the token ID
        const marketAssetObj = JSON.parse(marketAsset);
        const tokenId = marketAssetObj?.combinatorialToken;

        if (tokenId) {
          // Find the matching combo token
          const matchingToken = comboTokens.find(
            (token) => token.CombinatorialToken === tokenId,
          );
          if (matchingToken) {
            sortedTokens.push(matchingToken);
          }
        }
      }

      // If we didn't find all tokens, fall back to original order
      return sortedTokens.length > 0
        ? sortedTokens
        : comboTokens.slice(0, outcomeAssets.length);
    }

    // True combo market - try to match tokens and maintain market.outcomeAssets order
    const filtered = poolData.assetIds.filter((poolAsset) => {
      if (isCombinatorialToken(poolAsset)) {
        const hasMatch = marketAssetStrings.some((marketAssetString: string) =>
          marketAssetString.includes(poolAsset.CombinatorialToken),
        );
        return hasMatch;
      } else {
        const poolAssetString = JSON.stringify(poolAsset);
        const hasMatch = marketAssetStrings.some(
          (marketAssetString: string) => marketAssetString === poolAssetString,
        );
        return hasMatch;
      }
    });

    // If filtering removed everything, return all non-combo assets as fallback
    if (filtered.length === 0) {
      return poolData.assetIds.filter((asset) => !isCombinatorialToken(asset));
    }

    // Sort filtered assets to match market.outcomeAssets order
    const sortedFiltered = filtered.sort((a, b) => {
      const aString = isCombinatorialToken(a)
        ? a.CombinatorialToken
        : JSON.stringify(a);
      const bString = isCombinatorialToken(b)
        ? b.CombinatorialToken
        : JSON.stringify(b);

      const aIndex = marketAssetStrings.findIndex((marketAsset: string) =>
        marketAsset.includes(aString),
      );
      const bIndex = marketAssetStrings.findIndex((marketAsset: string) =>
        marketAsset.includes(bString),
      );

      // If not found, put at end
      const aPos = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bPos = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

      return aPos - bPos;
    });

    return sortedFiltered;
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

  const [showLiquidity, setShowLiquidity] = useState(false);

  const { data: disputes } = useMarketDisputes(marketId || 0);

  const { data: marketStage } = useMarketStage(market ?? undefined);
  const { data: spotPrices, refetch: refetchSpotPrices } = useMarketSpotPrices(
    marketId || 0,
  );

  const baseAsset = parseAssetIdString(marketData?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAsset);

  const [showTwitchChat, setShowTwitchChat] = useState(true);

  const wallet = useWallet();

  // Market pool status - must be declared early for use in JSX
  // Use static data if available, fallback to dynamic data
  const marketHasPool = marketData?.neoPool != null || market?.neoPool != null;

  const handlePoolDeployed = () => {
    setPoolDeployed(true);
    setShowLiquidity(true);
    // Refetch market data after pool deployment
    refetchMarket();
    refetchSpotPrices();
  };

  const toggleLiquiditySection = () => {
    setShowLiquidity(!showLiquidity);
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

    // Debug logging
    const filteredAssets = relevantPoolAssets.filter(isCombinatorialToken);

    return filteredAssets.map((asset, index) => {
      const categoryIndex = index < categories.length ? index : 0;
      return {
        assetId: asset,
        name: categories[categoryIndex]?.name || `Outcome ${index}`,
        color: categories[categoryIndex]?.color || colors[index],
      };
    });
  }, [
    relevantPoolAssets,
    market?.categories,
    market?.marketId,
    marketData?.categories,
    marketData?.marketId,
  ]);

  return (
    <div className="w-full overflow-x-hidden">
      <div className="relative grid gap-8 md:grid-cols-[1fr_auto] lg:gap-10">
        <div className="min-w-0">
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
            <div className="mt-[10px] text-ztg-14-150 text-red-400">
              Market rejected: {market.rejectReason}
            </div>
          )}

          <div className="mt-8 rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4 md:p-5">
            <Tab.Group defaultIndex={hasLiveTwitchStream ? 1 : 0}>
              <Tab.List
                className={`flex gap-1.5 text-xs sm:gap-2 sm:text-sm ${
                  activeTabsCount < 2 ? "hidden" : ""
                }`}
              >
                <Tab
                  key="chart"
                  className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/70 shadow-md backdrop-blur-sm ui-selected:bg-ztg-green-600/80 ui-selected:text-white sm:text-sm"
                >
                  Chart
                </Tab>

                <Tab
                  key="twitch"
                  className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white/70 shadow-md backdrop-blur-sm ui-selected:bg-ztg-green-600/80 ui-selected:text-white sm:gap-2 sm:text-sm"
                >
                  <FaTwitch size={14} className="sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap">Twitch Stream</span>
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
                        showTwitchChat ? "text-ztg-green-400" : "text-white/50"
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
              <div className="mt-8 rounded-lg bg-white/10 p-4 shadow-lg backdrop-blur-md">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  My Orders
                </h3>
                <div className="overflow-hidden rounded-lg">
                  <OrdersTable
                    where={{
                      marketId_eq: marketId,
                      makerAccountId_eq: realAddress,
                    }}
                  />
                </div>
              </div>
            )}
          {marketIsLoading === false && marketHasPool === false && (
            <div className="mt-8 flex items-center gap-2.5 rounded-lg border-2 border-red-500/40 bg-red-900/30 p-3 text-red-400 shadow-md backdrop-blur-sm sm:gap-3 sm:p-4">
              <AlertTriangle
                size={18}
                className="flex-shrink-0 sm:h-5 sm:w-5"
              />
              <div
                className="text-xs sm:text-sm"
                data-test="liquidityPoolMessage"
              >
                This market doesn't have a liquidity pool and therefore cannot
                be traded
              </div>
            </div>
          )}
          <div className="mt-8">
            {marketData?.marketType?.scalar !== null && (
              <div className="mb-8">
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
            <div className="rounded-lg bg-white/15 shadow-lg backdrop-blur-md">
              <div className="overflow-hidden rounded-lg">
                <MarketAssetDetails
                  marketId={marketId ?? 0}
                  categories={marketData.categories}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <MarketDescription market={marketData} />
          </div>

          {marketHasPool === true && (
            <div className="mt-8 rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4">
              <h3 className="mb-3 text-base font-semibold text-white sm:mb-4 sm:text-lg">
                Latest Trades
              </h3>
              <div className="pb-3 sm:pb-4">
                <LatestTrades
                  limit={3}
                  marketId={marketId}
                  outcomeAssets={(() => {
                    if (!relevantPoolAssets?.some(isCombinatorialToken))
                      return undefined;

                    const comboAssets =
                      relevantPoolAssets.filter(isCombinatorialToken);

                    // Apply consistent ordering to match market.outcomeAssets
                    if (!marketData?.outcomeAssets) return comboAssets;

                    return comboAssets.sort((a, b) => {
                      const aIndex = marketData.outcomeAssets.findIndex(
                        (marketAsset) => {
                          if (
                            typeof marketAsset === "string" &&
                            marketAsset.includes(a.CombinatorialToken)
                          ) {
                            return true;
                          }
                          return JSON.stringify(marketAsset).includes(
                            a.CombinatorialToken,
                          );
                        },
                      );

                      const bIndex = marketData.outcomeAssets.findIndex(
                        (marketAsset) => {
                          if (
                            typeof marketAsset === "string" &&
                            marketAsset.includes(b.CombinatorialToken)
                          ) {
                            return true;
                          }
                          return JSON.stringify(marketAsset).includes(
                            b.CombinatorialToken,
                          );
                        },
                      );

                      return aIndex - bIndex;
                    });
                  })()}
                  outcomeNames={
                    relevantPoolAssets?.some(isCombinatorialToken)
                      ? marketData?.categories?.map((cat) => cat.name)
                      : undefined
                  }
                />
              </div>
            </div>
          )}

          {marketHasPool === false && (
            <div className="mt-8">
              <PoolDeployer
                marketId={marketId}
                onPoolDeployed={handlePoolDeployed}
              />
            </div>
          )}
          {market && (marketHasPool || poolDeployed) && (
            <div className="mt-8">
              <div
                className="mb-3 flex cursor-pointer items-center rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold text-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-xl sm:mb-4 sm:px-4 sm:py-3 sm:text-base"
                onClick={() => toggleLiquiditySection()}
              >
                <div>Show Liquidity</div>
                <ChevronDown
                  size={16}
                  className={`ml-2 transition-transform ${
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
                <div className="rounded-lg bg-white/10 p-4 shadow-lg backdrop-blur-md">
                  <MarketLiquiditySection
                    pool={poolDeployed}
                    market={market}
                    comboMarket={false}
                  />
                </div>
              </Transition>
            </div>
          )}
        </div>

        <div className="hidden md:block md:w-[320px] lg:w-[400px] xl:w-[460px]">
          <div className="sticky">
            <div className="mb-12 animate-pop-in rounded-lg border-2 border-white/10 bg-white/10 opacity-0 shadow-xl ring-2 ring-white/5 backdrop-blur-lg">
              {market?.status === MarketStatus.Active ||
              marketData?.status === "Active" ? (
                <>
                  {marketHasPool ? (
                    <Amm2TradeForm
                      marketId={marketId}
                      poolData={poolData}
                      filteredAssets={relevantPoolAssets}
                      outcomeCombinations={outcomeCombinations}
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-4 text-orange-400 shadow-md backdrop-blur-sm">
                      <AlertTriangle
                        size={18}
                        className="flex-shrink-0 sm:h-5 sm:w-5"
                      />
                      <div className="text-sm">
                        This market doesn't have a liquidity pool yet. Deploy a
                        pool below to enable trading.
                      </div>
                    </div>
                  )}
                </>
              ) : (market?.status === MarketStatus.Closed ||
                  marketData?.status === "Closed") &&
                canReport &&
                market ? (
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
          poolData={poolData}
          marketHasPool={marketHasPool}
        />
      )}
    </div>
  );
};

const MobileContextButtons = ({
  market,
  relevantPoolAssets,
  marketData,
  poolData,
  marketHasPool,
}: {
  market: FullMarketFragment | null | undefined;
  relevantPoolAssets?: (MarketOutcomeAssetId | CombinatorialToken)[];
  marketData?: any; // Allow any type for marketData since it comes from static props
  poolData?: any;
  marketHasPool: boolean;
}) => {
  const wallet = useWallet();

  const { data: marketStage } = useMarketStage(market ?? undefined);
  const isOracle = market?.oracle === wallet.realAddress;
  const canReport =
    marketStage?.type === "OpenReportingPeriod" ||
    (marketStage?.type === "OracleReportingPeriod" && isOracle);

  const outcomeAssets = (
    market?.outcomeAssets ||
    marketData?.outcomeAssets ||
    []
  ).map((assetIdString: string) =>
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
          className="fixed left-0 top-0 z-40 h-full w-full bg-ztg-primary-950/50 backdrop-blur-md md:hidden"
        />
      </Transition>

      <div
        className={`pb-safe fixed bottom-12 left-0 right-0 z-50 w-full rounded-t-lg border-t-2 border-white/10 bg-white/10 pb-2 shadow-2xl ring-2 ring-white/5 backdrop-blur-lg transition-all duration-500 ease-in-out md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {market?.status === MarketStatus.Active ||
        marketData?.status === "Active" ? (
          marketHasPool ? (
            <Amm2TradeForm
              marketId={market?.marketId || marketData?.marketId || 0}
              poolData={poolData}
              showTabs={false}
              selectedTab={
                tradeItem?.action === "buy"
                  ? TradeTabType.Buy
                  : TradeTabType.Sell
              }
              filteredAssets={relevantPoolAssets}
              outcomeCombinations={outcomeCombinations}
            />
          ) : (
            <div className="mx-4 my-4 flex items-center gap-2.5 rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-4 text-orange-400 shadow-md backdrop-blur-sm">
              <AlertTriangle
                size={18}
                className="flex-shrink-0 sm:h-5 sm:w-5"
              />
              <div className="text-sm">
                This market doesn't have a liquidity pool yet. Deploy a pool to
                enable trading.
              </div>
            </div>
          )
        ) : (market?.status === MarketStatus.Closed ||
            marketData?.status === "Closed") &&
          canReport ? (
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

      {(market?.status === MarketStatus.Active ||
        marketData?.status === "Active" ||
        market?.status === MarketStatus.Closed ||
        marketData?.status === "Closed" ||
        market?.status === MarketStatus.Reported ||
        marketData?.status === "Reported") && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="flex h-14 cursor-pointer text-base font-semibold sm:text-lg">
            {market?.status === MarketStatus.Active ||
            marketData?.status === "Active" ? (
              marketHasPool ? (
                <>
                  <div
                    className={`center h-full flex-1 border-r-2 border-white/10 transition-all ${
                      tradeItem?.action === "buy"
                        ? "bg-ztg-green-600/90 text-white shadow-md backdrop-blur-md"
                        : "bg-white/10 text-white/90 shadow-md backdrop-blur-md hover:bg-white/15"
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
                      className={`ml-1.5 h-5 w-0 transition-all ${
                        open && tradeItem?.action === "buy" && "w-5"
                      }`}
                    />
                  </div>
                  <div
                    className={`center h-full flex-1 transition-all ${
                      tradeItem?.action === "sell"
                        ? "bg-red-600/90 text-white shadow-md backdrop-blur-md"
                        : "bg-white/10 text-white/90 shadow-md backdrop-blur-md hover:bg-white/15"
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
                      className={`ml-1.5 h-5 w-0 transition-all ${
                        open && tradeItem?.action === "sell" && "w-5"
                      }`}
                    />
                  </div>
                </>
              ) : (
                <div className="center h-full w-full bg-white/10 text-white/60 shadow-md backdrop-blur-md">
                  Trading unavailable - No liquidity pool
                </div>
              )
            ) : market?.status === MarketStatus.Closed && canReport ? (
              <>
                <div
                  className={`center h-full flex-1 transition-all ${
                    !open
                      ? "bg-ztg-green-600/90 text-white shadow-md backdrop-blur-md"
                      : "bg-white/10 text-white/90 backdrop-blur-md hover:bg-white/15"
                  }`}
                  onClick={() => setOpen(!open)}
                >
                  {open ? <X className="h-5 w-5" /> : "Report"}
                </div>
              </>
            ) : market?.status === MarketStatus.Reported ? (
              <div
                className={`center h-full flex-1 transition-all ${
                  !open
                    ? "bg-orange-600/90 text-white shadow-md backdrop-blur-md"
                    : "bg-white/10 text-white/90 shadow-md backdrop-blur-md hover:bg-white/15"
                }`}
                onClick={() => setOpen(!open)}
              >
                {open ? <X className="h-5 w-5" /> : "Dispute"}
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
                className={`relative z-20 flex w-full items-center rounded-lg px-5 py-3 transition-all ${
                  !open
                    ? "bg-gradient-to-r from-orange-400/80 to-orange-500/80 text-white shadow-md backdrop-blur-md"
                    : "border-2 border-ztg-primary-200/30 bg-white/80 text-ztg-primary-800 shadow-md backdrop-blur-md"
                }`}
              >
                <h3
                  className={`flex-1 text-left text-base font-semibold ${
                    open ? "text-ztg-primary-900" : "text-white"
                  }`}
                >
                  {open ? "Close" : "Market can be disputed"}
                </h3>
                {open ? (
                  <X className="text-ztg-primary-900" size={18} />
                ) : (
                  <FaChevronUp
                    size={18}
                    className="rotate-180 justify-end text-white"
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
                className="relative z-10 -mt-[8px] rounded-b-lg bg-white/60 px-5 pb-10 pt-12 shadow-md backdrop-blur-sm"
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
    <div className="p-3 sm:p-4 md:p-5">
      {reportedOutcome ? (
        <ReportResult market={market} outcome={reportedOutcome} />
      ) : (
        <>
          <h4 className="mb-4 flex items-center gap-2 text-white">
            <AiOutlineFileAdd size={20} />
            <span className="font-semibold">Report Market Outcome</span>
          </h4>

          <p className="mb-6 text-sm text-white/90">
            Market has closed and the outcome can now be reported.
          </p>

          {stage?.type === "OpenReportingPeriod" && (
            <>
              <p className="-mt-3 mb-6 text-sm italic text-white/80">
                Oracle failed to report. Reporting is now open to all.
              </p>
              <p className="mb-6 text-sm text-white/90">
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
    <div className="p-3 sm:p-4 md:p-5">
      <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
        <Image width={22} height={22} src="/icons/court.svg" alt="court" />
        <span>Market Court Case</span>
      </h4>

      <p className="mb-5 text-sm text-white/90">
        Market has been disputed and is awaiting a ruling in court.
      </p>

      <button
        disabled={!isFetched}
        onClick={() => router.push(`/court/${caseId}`)}
        onMouseEnter={() => router.prefetch(`/court/${caseId}`)}
        className={`ztg-transition h-[56px] w-full rounded-full bg-gradient-to-r from-orange-400/80 to-orange-500/80 text-white shadow-md backdrop-blur-md transition-all hover:from-orange-500/80 hover:to-orange-600/80 hover:shadow-lg focus:outline-none disabled:cursor-default disabled:bg-ztg-primary-200/60 disabled:backdrop-blur-sm`}
      >
        View Case
      </button>
    </div>
  );
};

export default Market;
