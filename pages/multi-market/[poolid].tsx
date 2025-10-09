import { Tab } from "@headlessui/react";
import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, AssetId, ZTG } from "@zeitgeistpm/sdk";
import LatestTrades from "components/front-page/LatestTrades";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import ComboMarketHeader from "components/markets/ComboMarketHeader";
import MarketMeta from "components/meta/MarketMeta";
import OrdersTable from "components/orderbook/OrdersTable";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import RedeemButton from "components/assets/AssetActionButtons/RedeemButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import TimeSeriesChart, { ChartSeries } from "components/ui/TimeSeriesChart";
import TimeFilters, { TimeFilter, filters } from "components/ui/TimeFilters";
import { useComboMarketPriceHistory } from "lib/hooks/queries/useMarketPriceHistory";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { calcPriceHistoryStartDate } from "lib/util/calc-price-history-start";
import Skeleton from "components/ui/Skeleton";
import { Transition } from "@headlessui/react";
import Decimal from "decimal.js";
import { useComboMarket } from "lib/hooks/queries/useComboMarket";
import { OutcomeCombination } from "lib/hooks/useVirtualMarket";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useNeoPoolParentCollectionIds } from "lib/hooks/queries/useNeoPoolParentCollectionIds";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarket24hrPriceChanges } from "lib/hooks/queries/useMarket24hrPriceChanges";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { useTradeItem } from "lib/hooks/trade";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useWallet } from "lib/state/wallet";
import { useVirtualMarket } from "lib/hooks/useVirtualMarket";
import { useBalance } from "lib/hooks/queries/useBalance";
import { usePoolStats } from "lib/hooks/queries/usePoolStats";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import { useState, useMemo } from "react";
import { AlertTriangle, ChevronDown, ExternalLink, X, Info } from "react-feather";
import { parseAssetId } from "@zeitgeistpm/sdk";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";

const SimilarMarketsSection = dynamic(
  () => import("../../components/markets/SimilarMarketsSection"),
  {
    ssr: false,
  },
);

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const poolId = params.poolid;

  return {
    props: {
      poolId: Number(poolId),
    },
    revalidate: 60,
  };
}

type ComboMarketPageProps = {
  poolId: number;
};

// Asset details table for combo market outcomes
const ComboAssetDetails = ({
  combinations,
  poolId,
  baseAsset,
  virtualMarket,
  sourceMarkets,
}: {
  combinations: OutcomeCombination[];
  poolId: number;
  baseAsset: AssetId;
  virtualMarket: FullMarketFragment;
  sourceMarkets: [FullMarketFragment, FullMarketFragment];
}) => {
  // Fetch prices with the virtualMarket
  const { data: spotPrices } = useMarketSpotPrices(poolId, 0, virtualMarket);

  const { data: priceChanges } = useMarket24hrPriceChanges(
    poolId,
    virtualMarket,
  );

  const { data: usdPrice } = useAssetUsdPrice(baseAsset);

  const totalAssetPrice = spotPrices
    ? Array.from(spotPrices.values()).reduce(
        (val, cur) => val.plus(cur),
        new Decimal(0),
      )
    : new Decimal(0);

  const columns: TableColumn[] = [
    { header: "Outcome", accessor: "outcome", type: "text" },
    {
      header: "Implied %",
      accessor: "pre",
      type: "percentage",
      collapseOrder: 1,
    },
    { header: "Price", accessor: "totalValue", type: "currency" },
    // {
    //   header: "24Hr Change",
    //   accessor: "change",
    //   type: "change",
    //   width: "120px",
    //   collapseOrder: 2,
    // },
  ];

  // Build table data from combinations
  const tableData: TableData[] | undefined = combinations?.map(
    (combination, index) => {
      const currentPrice = spotPrices?.get(index)?.toNumber();
      const priceChange = priceChanges?.get(index);

      // Extract outcomes from combination name
      const [market1Outcome, market2Outcome] = combination.name.split(" & ");

      return {
        assetId: index,
        id: index,
        outcome: (
          <div className="flex items-start gap-2 py-2">
            <div
              className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: combination.color }}
            />
            <div className="flex flex-col gap-1">
              <span className="font-semibold">{combination.name}</span>
              <div className="text-xxs text-gray-600 leading-relaxed">
                <div>Assume: <span className="font-bold">{market1Outcome}</span>, {sourceMarkets[0].question}</div>
                <div>Then: <span className="font-bold">{market2Outcome}</span>, {sourceMarkets[1].question}</div>
              </div>
            </div>
          </div>
        ),
        totalValue: {
          value: currentPrice ?? 0,
          usdValue: new Decimal(
            currentPrice ? (usdPrice?.mul(currentPrice) ?? 0) : 0,
          ).toNumber(),
        },
        pre:
          currentPrice != null && totalAssetPrice.toNumber() > 0
            ? Math.round((currentPrice / totalAssetPrice.toNumber()) * 100)
            : null,
        // change: priceChange,
      };
    },
  );

  return <Table columns={columns} data={tableData} />;
};

// Market stats section for combo markets
const ComboMarketStats = ({
  poolId,
  sourceMarkets,
}: {
  poolId: number;
  sourceMarkets: [FullMarketFragment, FullMarketFragment];
}) => {
  const { data: poolStats, isLoading: isStatsLoading } = usePoolStats([poolId]);

  // Get earliest start date and latest end date from source markets
  const starts = Math.min(
    ...sourceMarkets.map((m) => Number(m.period.start)),
  );
  const ends = Math.max(
    ...sourceMarkets.map((m) => Number(m.period.end)),
  );

  const liquidity = poolStats?.[0]?.liquidity;
  const volume = poolStats?.[0]?.volume
    ? new Decimal(poolStats[0].volume).div(ZTG).toNumber()
    : 0;

  return (
    <div className="mb-6 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Combinatorial Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-purple-500 px-3 py-1 text-sm font-semibold text-white shadow-sm">
            <span>Combinatorial</span>
            <div className="group relative">
              <Info size={14} className="cursor-help" />
              <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-80 rounded-lg bg-gray-900 px-4 py-3 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                <div className="space-y-2">
                  <p className="font-semibold">How Combinatorial Markets Work:</p>
                  <p>
                    The <strong>Assume</strong> market is the condition, and the <strong>Then</strong> market is the outcome.
                    This creates combinations like: "Assuming outcome X happens in Market 1, THEN what happens in Market 2?"
                  </p>
                  <p className="text-purple-300">
                    Example: Assume "Trump wins" → Then "Bitcoin reaches $100k"
                  </p>
                </div>
                <div className="absolute left-4 top-0 -translate-y-1/2">
                  <div className="h-2 w-2 rotate-45 bg-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats - Inline on larger screens */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-4">
          {/* Start Date */}
          <div className="rounded-md bg-white/60 px-2.5 py-1.5 backdrop-blur-sm">
            <div className="text-xxs font-medium text-gray-600">
              {hasDatePassed(starts) ? "Started" : "Starts"}
            </div>
            <div className="text-xs font-bold text-gray-900">
              {new Intl.DateTimeFormat("default", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(starts)}
            </div>
          </div>

          {/* End Date */}
          <div className="rounded-md bg-white/60 px-2.5 py-1.5 backdrop-blur-sm">
            <div className="text-xxs font-medium text-gray-600">
              {hasDatePassed(ends) ? "Ended" : "Ends"}
            </div>
            <div className="text-xs font-bold text-gray-900">
              {new Intl.DateTimeFormat("default", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(ends)}
            </div>
          </div>

          {/* Volume */}
          {isStatsLoading === false ? (
            <div className="rounded-md bg-white/60 px-2.5 py-1.5 backdrop-blur-sm">
              <div className="text-xxs font-medium text-gray-600">Volume</div>
              <div className="text-xs font-bold text-gray-900">
                {formatNumberCompact(volume)} ZTG
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-white/60 px-2.5 py-1.5 backdrop-blur-sm">
              <Skeleton width="60px" height="24px" />
            </div>
          )}

          {/* Liquidity */}
          {isStatsLoading === false ? (
            <div className="rounded-md bg-white/60 px-2.5 py-1.5 backdrop-blur-sm">
              <div className="text-xxs font-medium text-gray-600">Liquidity</div>
              <div className="text-xs font-bold text-gray-900">
                {formatNumberCompact(new Decimal(liquidity ?? 0).div(ZTG).toNumber())} ZTG
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-white/60 px-2.5 py-1.5 backdrop-blur-sm">
              <Skeleton width="60px" height="24px" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Helper function to set time to now (copied from MarketChart)
const setTimeToNow = (date: Date) => {
  const now = new Date();
  date.setHours(now.getHours());
  date.setMinutes(now.getMinutes());
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

// Chart component for combo markets
const ComboChart = ({
  chartSeries,
  poolId,
  baseAsset,
  comboMarketData,
}: {
  chartSeries: ChartSeries[];
  poolId: number;
  baseAsset?: AssetId;
  comboMarketData?: any; // Combo market data with createdAt and sourceMarkets
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[1]);

  const baseAssetId = baseAsset;
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const startDateISOString = useMemo(() => {
    // Use pool creation date from comboMarketData (from GraphQL)
    const poolCreationDate = comboMarketData?.createdAt
      ? new Date(comboMarketData.createdAt)
      : new Date();

    // Get the earliest resolution date from source markets' period.end timestamps
    let resolutionDate = new Date();
    if (
      comboMarketData?.sourceMarkets &&
      comboMarketData.sourceMarkets.length > 0
    ) {
      const earliestEndTimestamp = Math.min(
        ...comboMarketData.sourceMarkets.map((m: any) => Number(m.period.end)),
      );
      resolutionDate = new Date(earliestEndTimestamp);
    }

    const startDate = calcPriceHistoryStartDate(
      "Active" as any,
      chartFilter,
      poolCreationDate,
      resolutionDate,
    );

    return setTimeToNow(startDate).toISOString();
  }, [
    chartFilter.label,
    comboMarketData?.createdAt,
    comboMarketData?.sourceMarkets,
  ]);

  const priceHistoryQuery = useComboMarketPriceHistory(
    poolId,
    chartFilter.intervalUnit,
    chartFilter.intervalValue,
    startDateISOString,
  );
  const { data: prices, isLoading, isSuccess } = priceHistoryQuery;

  const chartData =
    isSuccess && prices
      ? prices
          .filter((data) => data.prices.every((p) => p.price != null))
          .map((price) => {
            const time = new Date(price.timestamp).getTime();

            // Map prices to chart data format by matching asset IDs
            const assetPrices = price.prices.reduce((obj, priceData) => {
              // Find the matching combination by comparing asset IDs
              const matchingIndex = comboMarketData.outcomeCombinations.findIndex(
                (combo) => {
                  try {
                    // Parse the assetId string from the API
                    const apiAssetId = JSON.parse(priceData.assetId);
                    // Compare the combinatorial token hex values (case-insensitive)
                    return (
                      apiAssetId.combinatorialToken?.toLowerCase() ===
                      combo.assetId.CombinatorialToken.toLowerCase()
                    );
                  } catch (e) {
                    return false;
                  }
                }
              );

              // Only add if we found a matching combination
              if (matchingIndex !== -1) {
                // Ensure prices don't exceed 1
                return {
                  ...obj,
                  [`v${matchingIndex}`]: priceData.price > 1 ? 1 : priceData.price,
                };
              }
              return obj;
            }, {});

            return {
              t: time,
              ...assetPrices,
            };
          })
      : [];

  const handleFilterChange = (filter: TimeFilter) => {
    setChartFilter(filter);
  };

  // Use colors from chartSeries or generate new ones
  const colors = chartSeries.map((s) => s.color || "#000");
  return (
    <div className="-ml-ztg-25 flex flex-col">
      <div className="ml-auto">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
      </div>
      <TimeSeriesChart
        data={chartData || []}
        series={chartSeries.map((s, i) => ({ ...s, color: colors[i] }))}
        yDomain={[0, 1]}
        yUnits={metadata?.symbol || "ZTG"}
        isLoading={isLoading}
      />
    </div>
  );
};

const MobileContextButtons = ({
  poolId,
  comboMarketData,
  parentCollectionIds,
}: {
  poolId: number;
  comboMarketData: any;
  parentCollectionIds?: string[] | null;
}) => {
  const { data: tradeItem, set: setTradeItem } = useTradeItem();
  const [open, setOpen] = useState(false);
  const [showPartialRedeem, setShowPartialRedeem] = useState(false);

  // Default to "buy" action if not set
  const currentAction = tradeItem?.action ?? "buy";

  // Check if combo market is active (both source markets must be Active)
  const comboMarketIsActive = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Active,
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if combo market is resolved (both source markets must be Resolved)
  const comboMarketIsResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Resolved,
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if child market (last in marketIds) is resolved AND parent is still active
  const childMarketResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets || !comboMarketData?.marketIds)
      return false;
    const childMarketId = comboMarketData.marketIds[1];
    const parentMarketId = comboMarketData.marketIds[0];
    const childMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === childMarketId,
    );
    const parentMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === parentMarketId,
    );
    return (
      childMarket?.status === MarketStatus.Resolved &&
      parentMarket?.status === MarketStatus.Active
    );
  }, [comboMarketData?.sourceMarkets, comboMarketData?.marketIds]);

  // Get virtual market for redeem button
  const marketIds = comboMarketData?.marketIds;
  const virtualMarket = useVirtualMarket(poolId, marketIds);

  if (!comboMarketIsActive && !comboMarketIsResolved && !childMarketResolved) {
    return null; // Don't show mobile buttons if market is closed but not resolved
  }

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
        {comboMarketIsActive ? (
          <Amm2TradeForm
            marketId={0}
            poolData={comboMarketData}
            showTabs={false}
            selectedTab={
              currentAction === "buy" ? TradeTabType.Buy : TradeTabType.Sell
            }
            outcomeCombinations={comboMarketData?.outcomeCombinations}
          />
        ) : comboMarketIsResolved && virtualMarket ? (
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Redeem Your Tokens</h3>
            <p className="mb-6 text-sm text-gray-600">
              Both source markets have been resolved. Redeem your outcome tokens
              below.
            </p>
            <div className="space-y-4">
              {comboMarketData?.outcomeCombinations
                ?.filter((_: any, index: number) => {
                  if (virtualMarket.resolvedOutcome === null) {
                    // Parent is scalar - show all positions (blockchain calculates payouts)
                    return true;
                  }

                  const isParentScalar = (virtualMarket.neoPool as any)?._debug
                    ?.isParentScalar;
                  const isChildScalar = (virtualMarket.neoPool as any)?._debug
                    ?.isChildScalar;

                  if (isChildScalar && !isParentScalar) {
                    // Parent categorical, child scalar
                    // Show both scalar positions (Short & Long) for the resolved parent outcome
                    const parentResolvedIndex = Number(
                      virtualMarket.resolvedOutcome,
                    );
                    const numChildOutcomes = 2; // Scalar has 2 outcomes
                    const startIndex = parentResolvedIndex * numChildOutcomes;
                    const endIndex = startIndex + numChildOutcomes;
                    return index >= startIndex && index < endIndex;
                  } else {
                    // Both categorical - show only the single winning outcome
                    return index === Number(virtualMarket.resolvedOutcome);
                  }
                })
                .map((combo: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: combo.color }}
                      />
                      <span className="font-medium">{combo.name}</span>
                    </div>
                    <RedeemButton
                      market={virtualMarket}
                      assetId={combo.assetId}
                      underlyingMarketIds={comboMarketData.marketIds}
                      isPartialRedemption={false}
                      parentCollectionIds={parentCollectionIds ?? undefined}
                      showBalance={true}
                    />
                  </div>
                ))}
              <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-800">
                  To Get Your Collateral Back:
                </h4>
                <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>Redeem tokens on this page</strong> → receive Market
                    1 ("Assume" market) tokens
                  </li>
                  <li>
                    <strong>Redeem Market 1 tokens</strong> on the Market 1 page
                    → receive your collateral
                  </li>
                </ol>
                <p className="text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Redeeming here is only the first
                  step. Visit Market 1 (the "Assume" market) to complete your
                  redemption and recover your collateral.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Partial Redeem Panel for Mobile */}
      <Transition
        show={showPartialRedeem}
        enter="transition-opacity ease-in-out duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in-out duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="fixed left-0 top-0 h-full w-full"
      >
        <div
          onClick={() => setShowPartialRedeem(false)}
          className="fixed left-0 top-0 z-40 h-full w-full bg-black/20 md:hidden"
        />
      </Transition>

      <div
        className={`fixed bottom-20 left-0 z-50 w-full rounded-t-lg bg-white pb-12 transition-all duration-500 ease-in-out md:hidden ${
          showPartialRedeem ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {childMarketResolved && virtualMarket && (
          <div className="p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">
              Partial Redemption Available
            </h3>
            <p className="mb-4 text-sm text-blue-700">
              Market 2 ("Then" market) has resolved. You can redeem tokens
              for Market 1 ("Assume" market) tokens and use those for trading.
            </p>
            <div className="space-y-3">
              {comboMarketData?.outcomeCombinations?.map(
                (combo: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: combo.color }}
                      />
                      <span className="text-sm font-medium">{combo.name}</span>
                    </div>
                    <RedeemButton
                      market={virtualMarket}
                      assetId={combo.assetId}
                      underlyingMarketIds={comboMarketData.marketIds}
                      isPartialRedemption={true}
                      parentCollectionIds={parentCollectionIds ?? undefined}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {comboMarketIsActive ? (
          <div className="flex h-20 cursor-pointer text-lg font-semibold">
            <div
              className={`center h-full flex-1  ${
                currentAction === "buy"
                  ? "bg-fog-of-war text-white"
                  : "bg-white text-black"
              } `}
              onClick={() => {
                setTradeItem({
                  assetId: tradeItem?.assetId ?? ({} as MarketOutcomeAssetId),
                  action: "buy",
                });
                if (open && currentAction === "buy") {
                  setOpen(false);
                } else {
                  setOpen(true);
                }
              }}
            >
              Buy{" "}
              <X
                className={`center h-full w-0 transition-all  ${
                  open && currentAction === "buy" && "w-6"
                }`}
              />
            </div>
            <div
              className={`center h-full flex-1 ${
                currentAction === "sell"
                  ? "bg-fog-of-war text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => {
                setTradeItem({
                  assetId: tradeItem?.assetId ?? ({} as MarketOutcomeAssetId),
                  action: "sell",
                });
                if (open && currentAction === "sell") {
                  setOpen(false);
                } else {
                  setOpen(true);
                }
              }}
            >
              Sell
              <X
                className={`center h-full w-0 transition-all  ${
                  open && currentAction === "sell" && "w-6"
                }`}
              />
            </div>
          </div>
        ) : comboMarketIsResolved ? (
          <div className="flex h-20 cursor-pointer text-lg font-semibold">
            <div
              className="center h-full w-full bg-ztg-blue text-white"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={24} /> : "Redeem Tokens"}
            </div>
          </div>
        ) : childMarketResolved ? (
          <div className="flex h-20 cursor-pointer text-lg font-semibold">
            <div
              className="center h-full w-full bg-blue-500 text-white"
              onClick={() => setShowPartialRedeem(!showPartialRedeem)}
            >
              {showPartialRedeem ? <X size={24} /> : "Redeem Tokens (Partial)"}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

const ComboMarket: NextPage<ComboMarketPageProps> = ({
  poolId: staticPoolId,
}) => {
  const router = useRouter();
  // Prioritize URL parameter over static props to ensure correct data on navigation
  const poolId =
    router.isReady && router.query.poolid
      ? Number(router.query.poolid)
      : staticPoolId;

  const { realAddress } = useWallet();
  const { data: comboMarketData, isLoading } = useComboMarket(poolId);
  const { data: orders, isLoading: isOrdersLoading } = useOrders({
    marketId_eq: poolId,
    makerAccountId_eq: realAddress,
  });
  const { data: parentCollectionIds } = useNeoPoolParentCollectionIds(poolId);
  // Extract market IDs from combo market data
  const marketIds = comboMarketData?.marketIds;

  // Use the virtual market hook with marketIds
  const virtualMarket = useVirtualMarket(poolId, marketIds);

  // Get market stages for source markets to determine combo pool stage
  const { data: market1Stage } = useMarketStage(
    comboMarketData?.sourceMarkets?.[0] as any,
  );
  const { data: market2Stage } = useMarketStage(
    comboMarketData?.sourceMarkets?.[1] as any,
  );

  const [showLiquidityParam, setShowLiquidityParam, unsetShowLiquidityParam] =
    useQueryParamState("showLiquidity");

  const showLiquidity = showLiquidityParam != null;

  const toggleLiquiditySection = () => {
    const nextState = !showLiquidity;
    if (nextState) {
      setShowLiquidityParam("");
    } else {
      unsetShowLiquidityParam();
    }
  };

  // Collect both market stages to show complete status for each source market
  const sourceMarketStages = useMemo(() => {
    if (!comboMarketData) return undefined;

    return [
      {
        market: comboMarketData.sourceMarkets[0],
        stage: market1Stage,
      },
      {
        market: comboMarketData.sourceMarkets[1],
        stage: market2Stage,
      },
    ];
  }, [market1Stage, market2Stage, comboMarketData]);

  // Check if combo market should allow trading (both source markets must be Active)
  const comboMarketIsActive = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Active,
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if combo market is resolved (both source markets must be Resolved)
  const comboMarketIsResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Resolved,
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if child market (last in marketIds) is resolved AND parent is still active
  // This allows partial redemption when child resolves first, but parent market continues
  const childMarketResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets || !comboMarketData?.marketIds)
      return false;
    const childMarketId = comboMarketData.marketIds[1]; // Last market ID is the child
    const parentMarketId = comboMarketData.marketIds[0]; // First market ID is the parent
    const childMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === childMarketId,
    );
    const parentMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === parentMarketId,
    );
    // Only show partial redemption if child is resolved AND parent is still active
    return (
      childMarket?.status === MarketStatus.Resolved &&
      parentMarket?.status === MarketStatus.Active
    );
  }, [comboMarketData?.sourceMarkets, comboMarketData?.marketIds]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Skeleton height="400px" width="100%" />
      </div>
    );
  }

  if (!comboMarketData || !virtualMarket) {
    return <NotFoundPage backText="Back To Markets" backLink="/markets" />;
  }

  // Use chart series from combo market data
  const chartSeries = comboMarketData.chartSeries;

  const hasChart = Boolean(chartSeries && comboMarketData);
  const marketHasPool = true; // Combo markets always have pools

  return (
    <div className="mt-6">
      <div className="relative flex flex-auto gap-12">
        <div className="flex-1 overflow-hidden">

          {/* Market Stats Section */}
          <ComboMarketStats
            poolId={poolId}
            sourceMarkets={comboMarketData.sourceMarkets}
          />
          <MarketMeta market={virtualMarket} />

          {/* Combo Market Header with Assume/Then cards */}
          {sourceMarketStages && (
            <ComboMarketHeader
              sourceMarketStages={sourceMarketStages}
              walletAddress={realAddress}
            />
          )}

          {/* Chart Section */}
          <div className="mt-4 rounded-lg border border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30 p-4 shadow-sm">
            <Tab.Group defaultIndex={0}>
              <Tab.List className="flex gap-2 text-sm"></Tab.List>

              <Tab.Panels className="mt-2">
                <Tab.Panel>
                  {hasChart ? (
                    <ComboChart
                      chartSeries={chartSeries}
                      poolId={poolId}
                      baseAsset={comboMarketData.baseAsset}
                      comboMarketData={comboMarketData}
                    />
                  ) : (
                    <div className="flex h-[400px] items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm">
                      <div className="text-center text-gray-500">
                        <AlertTriangle size={48} className="mx-auto mb-2" />
                        <p>Chart data not available</p>
                      </div>
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>

          {/* My Orders Section */}
          {realAddress &&
            isOrdersLoading === false &&
            (orders?.length ?? 0) > 0 && (
              <div className="mt-4 rounded-lg border border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30 p-4 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">My Orders</h3>
                <div className="rounded-lg bg-white/60 backdrop-blur-sm overflow-hidden">
                  <OrdersTable
                    where={{
                      marketId_eq: poolId,
                      makerAccountId_eq: realAddress,
                    }}
                  />
                </div>
              </div>
            )}

          {/* No Pool Warning */}
          {!marketHasPool && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-4 shadow-sm">
              <AlertTriangle size={24} className="flex-shrink-0 text-orange-500" />
              <div className="text-sm text-orange-900">
                This combinatorial market doesn't have a liquidity pool and
                therefore cannot be traded
              </div>
            </div>
          )}

          {/* Asset Details Table */}
          <div className="my-8 rounded-lg border border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30 p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Outcome Combinations</h3>
            <div className="rounded-lg bg-white/60 backdrop-blur-sm overflow-hidden">
              <ComboAssetDetails
                combinations={comboMarketData.outcomeCombinations}
                poolId={poolId}
                baseAsset={comboMarketData.baseAsset}
                virtualMarket={virtualMarket}
                sourceMarkets={comboMarketData.sourceMarkets}
              />
            </div>
          </div>

          {/* Market Description */}
          {/* <div className="mb-12 max-w-[90vw]">
            <MarketDescription market={virtualMarket} />
          </div> */}

          {/* Latest Trades */}
          {marketHasPool && (
            <div className="mt-10 rounded-lg border border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30 p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Latest Trades</h3>
              <div className="rounded-lg bg-white/60 backdrop-blur-sm overflow-hidden">
                <LatestTrades
                  limit={3}
                  marketId={poolId}
                  outcomeAssets={
                    comboMarketData?.outcomeCombinations?.map(
                      (combo) => combo.assetId,
                    ) || []
                  }
                  outcomeNames={
                    comboMarketData?.outcomeCombinations?.map(
                      (combo) => combo.name,
                    ) || []
                  }
                  marketQuestion={comboMarketData?.question}
                  isMultiMarket={true}
                />
              </div>
              {/* <Link
                className="w-full text-center text-ztg-blue"
                href={`/latest-trades?marketId=${poolId}`}
              >
                View more
              </Link> */}
            </div>
          )}

          {/* Liquidity Section */}
          {marketHasPool && (
            <div className="my-12">
              <div
                className="mb-4 flex cursor-pointer items-center rounded-lg border border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30 px-4 py-3 font-semibold text-purple-700 shadow-sm transition-colors hover:bg-purple-100/50"
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
                show={showLiquidity && Boolean(marketHasPool)}
              >
                <div className="rounded-lg border border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-blue-50/30 p-4 shadow-sm">
                  <div className="rounded-lg bg-white/60 backdrop-blur-sm overflow-hidden">
                    <MarketLiquiditySection
                      pool={true}
                      market={virtualMarket}
                      comboMarket={true}
                    />
                  </div>
                </div>
              </Transition>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:-mr-6 md:block md:w-[320px] lg:mr-auto lg:w-[460px]">
          <div className="sticky top-20">
            {comboMarketIsActive ? (
              <div
                className="mb-12 animate-pop-in rounded-lg opacity-0 shadow-lg"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(49, 125, 194, 0.2) 0%, rgba(225, 210, 241, 0.2) 100%)",
                }}
              >
                <Amm2TradeForm
                  marketId={0}
                  poolData={comboMarketData}
                  outcomeCombinations={comboMarketData?.outcomeCombinations}
                />
              </div>
            ) : comboMarketIsResolved ? (
              <div className="mb-12 rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold">
                  Redeem Your Tokens
                </h3>
                <p className="mb-6 text-sm text-gray-600">
                  Both source markets have been resolved. Redeem your outcome
                  tokens below.
                </p>
                <div className="space-y-4">
                  {comboMarketData?.outcomeCombinations
                    ?.filter((_: any, index: number) => {
                      if (virtualMarket?.resolvedOutcome === null) {
                        // Parent is scalar - show all positions (blockchain calculates payouts)
                        return true;
                      }

                      const isParentScalar = (virtualMarket.neoPool as any)
                        ?._debug?.isParentScalar;
                      const isChildScalar = (virtualMarket.neoPool as any)
                        ?._debug?.isChildScalar;

                      if (isChildScalar && !isParentScalar) {
                        // Parent categorical, child scalar
                        // Show both scalar positions (Short & Long) for the resolved parent outcome
                        const parentResolvedIndex = Number(
                          virtualMarket.resolvedOutcome,
                        );
                        const numChildOutcomes = 2; // Scalar has 2 outcomes
                        const startIndex =
                          parentResolvedIndex * numChildOutcomes;
                        const endIndex = startIndex + numChildOutcomes;
                        return index >= startIndex && index < endIndex;
                      } else {
                        // Both categorical - show only the single winning outcome
                        return (
                          virtualMarket?.resolvedOutcome !== null &&
                          index === Number(virtualMarket.resolvedOutcome)
                        );
                      }
                    })
                    .map((combo: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: combo.color }}
                          />
                          <span className="font-medium">{combo.name}</span>
                        </div>
                        <RedeemButton
                          market={virtualMarket}
                          assetId={combo.assetId as any}
                          underlyingMarketIds={comboMarketData.marketIds}
                          isPartialRedemption={false}
                          parentCollectionIds={parentCollectionIds ?? undefined}
                          showBalance={true}
                        />
                      </div>
                    ))}
                  <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800">
                      To Get Your Collateral Back:
                    </h4>
                    <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-gray-700">
                      <li>
                        <strong>Redeem tokens on this page</strong> → receive
                        Market 1 ("Assume" market) tokens
                      </li>
                      <li>
                        <strong>Redeem Market 1 tokens</strong> on the Market 1
                        page → receive your collateral
                      </li>
                    </ol>
                    <p className="text-xs text-gray-600">
                      💡 <strong>Tip:</strong> Redeeming here is only the first
                      step. Visit Market 1 (the "Assume" market) to complete
                      your redemption and recover your collateral.
                    </p>
                  </div>
                </div>
              </div>
            ) : childMarketResolved ? (
              <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 shadow-lg">
                <h3 className="mb-2 text-lg font-semibold text-blue-900">
                  Partial Redemption Available
                </h3>
                <p className="mb-4 text-sm text-blue-700">
                  Market 2 ("Then" market) has resolved. You can redeem
                  tokens for Market 1 ("Assume" market) tokens and use those for
                  trading.
                </p>
                <div className="space-y-3">
                  {comboMarketData?.outcomeCombinations?.map((combo, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: combo.color }}
                        />
                        <span className="text-sm font-medium">
                          {combo.name}
                        </span>
                      </div>
                      <RedeemButton
                        market={virtualMarket}
                        assetId={combo.assetId as any}
                        underlyingMarketIds={comboMarketData.marketIds}
                        isPartialRedemption={true}
                        parentCollectionIds={parentCollectionIds ?? undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-12 rounded-lg bg-gray-100 p-6 text-center shadow-lg">
                <AlertTriangle
                  className="mx-auto mb-3 text-orange-500"
                  size={32}
                />
                <h3 className="mb-2 text-lg font-semibold">Trading Closed</h3>
                <p className="text-sm text-gray-600">
                  This combinatorial market is closed because one or more source
                  markets have ended.
                </p>
              </div>
            )}
            <SimilarMarketsSection market={virtualMarket} />
          </div>
        </div>
      </div>
      <MobileContextButtons
        poolId={poolId}
        comboMarketData={comboMarketData}
        parentCollectionIds={parentCollectionIds}
      />
    </div>
  );
};

export default ComboMarket;
