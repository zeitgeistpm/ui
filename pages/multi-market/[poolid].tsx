import { Tab } from "@headlessui/react";
import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, AssetId, ZTG } from "@zeitgeistpm/sdk";
import LatestTrades from "components/front-page/LatestTrades";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import ComboMarketHeaderUnified from "components/markets/ComboMarketHeaderUnified";
import MarketMeta from "components/meta/MarketMeta";
import OrdersTable from "components/orderbook/OrdersTable";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import RedeemButton from "components/assets/AssetActionButtons/RedeemButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
import TimeFilters, { TimeFilter, filters } from "components/ui/TimeFilters";
import { useComboMarketPriceHistory } from "lib/hooks/queries/useMarketPriceHistory";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { calcPriceHistoryStartDate } from "lib/util/calc-price-history-start";
import Skeleton from "components/ui/Skeleton";
import { Transition } from "@headlessui/react";
import Decimal from "decimal.js";
import { useComboMarket } from "lib/hooks/queries/useComboMarket";
import { OutcomeCombination } from "lib/hooks/useVirtualMarket";
import { VirtualMarket } from "lib/types";
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
import { useState, useMemo, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  X,
  Info,
} from "react-feather";
import { parseAssetId } from "@zeitgeistpm/sdk";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";

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
              <span className="font-semibold text-white">{combination.name}</span>
              <div className="text-xxs leading-relaxed text-white/80">
                <div>
                  <span className="font-semibold text-blue-400">Assume:</span>{" "}
                  <span className="font-bold text-blue-400">{market1Outcome}</span>,{" "}
                  {sourceMarkets[0].question}
                </div>
                <div>
                  <span className="font-semibold text-ztg-green-400">Then:</span>{" "}
                  <span className="font-bold text-ztg-green-400">{market2Outcome}</span>,{" "}
                  {sourceMarkets[1].question}
                </div>
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

// Tooltip component that uses fixed positioning to escape stacking contexts
const CombinatorialTooltip = ({ children }: { children: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const updatePosition = () => {
        if (iconRef.current) {
          const rect = iconRef.current.getBoundingClientRect();
          // Position to the right of the info icon, vertically centered
          setPosition({
            top: rect.top + rect.height / 2,
            left: rect.right + 8, // 8px margin to the right
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isHovered]);

  const tooltipContent = isHovered && mounted ? (
    createPortal(
      <div
        className="pointer-events-none fixed z-[9999] w-80 rounded-lg border border-white/20 bg-ztg-primary-900/95 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-lg"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateY(-50%)',
        }}
      >
        <div className="space-y-2">
          <p className="font-semibold text-white">
            How Combinatorial Markets Work:
          </p>
          <p className="text-white/90">
            The <strong>Assume</strong> market is the condition, and the{" "}
            <strong>Then</strong> market is the outcome. This creates
            combinations like: "Assuming outcome X happens in Market 1,
            THEN what happens in Market 2?"
          </p>
          <p className="text-ztg-green-400">
            Example: Assume "Trump wins" → Then "Bitcoin reaches $100k"
          </p>
        </div>
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rotate-45 bg-ztg-primary-900/95 border-l border-b border-white/20"></div>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative inline-flex"
      >
        {React.cloneElement(children as React.ReactElement, { ref: iconRef })}
      </div>
      {tooltipContent}
    </>
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
          .filter((data) => {
            // Ensure prices exist and are valid numbers
            return (
              data.prices &&
              data.prices.length > 0 &&
              data.prices.every(
                (p) =>
                  p.price != null &&
                  !isNaN(Number(p.price)) &&
                  isFinite(Number(p.price)),
              )
            );
          })
          .map((price) => {
            const time = new Date(price.timestamp).getTime();

            // Map prices to chart data format by matching asset IDs
            const assetPrices = price.prices.reduce((obj, priceData) => {
              // Find the matching combination by comparing asset IDs
              const matchingIndex =
                comboMarketData.outcomeCombinations.findIndex((combo) => {
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
                });

              // Only add if we found a matching combination
              if (matchingIndex !== -1) {
                const priceValue = Number(priceData.price);
                // Validate price is a valid number before using it
                if (isNaN(priceValue) || !isFinite(priceValue)) {
                  return obj;
                }
                // Ensure prices don't exceed 1
                return {
                  ...obj,
                  [`v${matchingIndex}`]: priceValue > 1 ? 1 : priceValue,
                };
              }
              return obj;
            }, {});

            return {
              t: time,
              ...assetPrices,
            };
          })
          .filter((data) => {
            // Ensure we have at least one valid price value
            const keys = Object.keys(data).filter((k) => k !== "t");
            return keys.length > 0 && keys.some((k) => !isNaN(data[k]));
          }) as ChartData[]
      : [];

  const handleFilterChange = (filter: TimeFilter) => {
    setChartFilter(filter);
  };

  // Use colors from chartSeries or generate new ones
  const colors = chartSeries.map((s) => s.color || "#000");
  return (
    <div className="flex flex-col">
      <TimeSeriesChart
        data={chartData || []}
        series={chartSeries.map((s, i) => ({ ...s, color: colors[i] }))}
        yDomain={[0, 1]}
        yUnits={metadata?.symbol || "ZTG"}
        isLoading={isLoading}
      />
      <div className="mt-2 w-full sm:mt-3">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
      </div>
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
        className={`fixed bottom-12 left-0 right-0 z-50 w-full rounded-t-lg bg-ztg-primary-700/95 border-t-2 border-white/10 shadow-2xl backdrop-blur-lg pb-safe pb-2 transition-all duration-500 ease-in-out md:hidden ${
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
          <div className="p-4 sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Redeem Your Tokens</h3>
            <p className="mb-6 text-sm text-white/90">
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

                  const vm = virtualMarket as VirtualMarket;
                  const isParentScalar = vm.neoPool?.isParentScalar ?? false;
                  const isChildScalar = vm.neoPool?.isChildScalar ?? false;

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
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 p-4 shadow-md backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full flex-none"
                        style={{ backgroundColor: combo.color }}
                      />
                      <span className="font-medium text-white">{combo.name}</span>
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
              <div className="mt-6 rounded-lg border border-white/10 bg-white/10 p-4 shadow-md backdrop-blur-sm">
                <h4 className="mb-2 text-sm font-semibold text-white">
                  To Get Your Collateral Back:
                </h4>
                <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-white/90">
                  <li>
                    <strong>Redeem tokens on this page</strong> → receive Market
                    1 ("Assume" market) tokens
                  </li>
                  <li>
                    <strong>Redeem Market 1 tokens</strong> on the Market 1 page
                    → receive your collateral
                  </li>
                </ol>
                <p className="text-xs text-white/80">
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
        className={`fixed bottom-12 left-0 right-0 z-50 w-full rounded-t-lg bg-ztg-primary-700/95 border-t-2 border-white/10 shadow-2xl backdrop-blur-lg pb-safe pb-2 transition-all duration-500 ease-in-out md:hidden ${
          showPartialRedeem ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {childMarketResolved && virtualMarket && (
          <div className="p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg border border-ztg-green-400/40 bg-ztg-green-500/80 px-2 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                Partial Redemption
              </div>
              <h3 className="text-lg font-semibold text-white">
                Available
              </h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/90">
              <span className="font-semibold text-ztg-green-400">Market 2 ("Then" market)</span> has resolved. You can redeem tokens for{" "}
              <span className="font-semibold text-blue-400">Market 1 ("Assume" market)</span> tokens and use those for trading.
            </p>
            <div className="space-y-3">
              {comboMarketData?.outcomeCombinations
                ?.filter((combo: any) => {
                  // Get child market (marketIds[1]) resolved outcome
                  const childMarket = comboMarketData.sourceMarkets.find(
                    (m: FullMarketFragment) => m.marketId === comboMarketData.marketIds[1]
                  );

                  if (!childMarket || childMarket.resolvedOutcome === null || childMarket.resolvedOutcome === undefined) {
                    return false;
                  }

                  // If child market is scalar, show ALL combinations (blockchain calculates payouts)
                  const isChildScalar = childMarket.marketType?.scalar !== null;
                  if (isChildScalar) {
                    return true;
                  }

                  // For categorical child markets, filter by resolved outcome
                  const resolvedOutcomeIndex = typeof childMarket.resolvedOutcome === 'string'
                    ? parseInt(childMarket.resolvedOutcome)
                    : childMarket.resolvedOutcome;

                  if (resolvedOutcomeIndex === undefined || resolvedOutcomeIndex === null) {
                    return false;
                  }

                  const resolvedOutcomeName = childMarket.categories?.[resolvedOutcomeIndex]?.name;

                  // Only show combinations where market2Outcome matches the resolved outcome
                  return combo.market2Outcome === resolvedOutcomeName;
                })
                .map((combo: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 p-3 shadow-md backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full flex-none"
                        style={{ backgroundColor: combo.color }}
                      />
                      <span className="text-sm font-medium text-white">{combo.name}</span>
                    </div>
                    <RedeemButton
                      market={virtualMarket}
                      assetId={combo.assetId}
                      underlyingMarketIds={comboMarketData.marketIds}
                      isPartialRedemption={true}
                      parentCollectionIds={parentCollectionIds ?? undefined}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {comboMarketIsActive ? (
          <div className="flex h-14 cursor-pointer text-base font-semibold sm:text-lg">
            <div
              className={`center h-full flex-1 border-r-2 border-white/10 transition-all ${
                currentAction === "buy"
                  ? "bg-ztg-green-600/90 text-white shadow-md backdrop-blur-md"
                  : "bg-white/10 text-white/90 shadow-md backdrop-blur-md hover:bg-white/15"
              }`}
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
                className={`ml-1.5 h-5 w-0 transition-all ${
                  open && currentAction === "buy" && "w-5"
                }`}
              />
            </div>
            <div
              className={`center h-full flex-1 transition-all ${
                currentAction === "sell"
                  ? "bg-red-600/90 text-white shadow-md backdrop-blur-md"
                  : "bg-white/10 text-white/90 shadow-md backdrop-blur-md hover:bg-white/15"
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
                className={`ml-1.5 h-5 w-0 transition-all ${
                  open && currentAction === "sell" && "w-5"
                }`}
              />
            </div>
          </div>
        ) : comboMarketIsResolved ? (
          <div className="flex h-14 cursor-pointer text-base font-semibold sm:text-lg">
            <div
              className="center h-full w-full bg-ztg-green-600/90 text-white shadow-md backdrop-blur-md transition-all"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-5 w-5" /> : "Redeem Tokens"}
            </div>
          </div>
        ) : childMarketResolved ? (
          <div className="flex h-14 cursor-pointer text-base font-semibold sm:text-lg">
            <div
              className="center h-full w-full bg-ztg-green-600/90 text-white shadow-md backdrop-blur-md transition-all"
              onClick={() => setShowPartialRedeem(!showPartialRedeem)}
            >
              {showPartialRedeem ? <X className="h-5 w-5" /> : "Redeem Tokens (Partial)"}
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
    <div className="w-full overflow-x-hidden">
      <div className="relative grid gap-8 md:grid-cols-[1fr_auto] lg:gap-10">
        <div className="min-w-0">
          <MarketMeta market={virtualMarket} />

          {/* Unified Combo Market Header */}
          {sourceMarketStages && (
            <div className="relative rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4 md:p-5">
              {/* Back Button and Combinatorial Badge */}
              <div className="mb-6 flex items-center gap-2">
                <Link
                  href="/markets?status=Active&ordering=Newest&liquidityOnly=true&marketType=multi"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm font-medium text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <div className="relative flex items-center gap-1.5 rounded-lg bg-ztg-primary-800/40 px-3 py-1 text-sm font-semibold text-white shadow-md backdrop-blur-sm">
                  <span className="font-bold">Combinatorial</span>
                  <CombinatorialTooltip>
                    <Info size={14} className="cursor-help text-white/80" />
                  </CombinatorialTooltip>
                </div>
              </div>

              <ComboMarketHeaderUnified
                poolId={poolId}
                sourceMarketStages={sourceMarketStages}
                walletAddress={realAddress}
                virtualMarket={virtualMarket}
              />
            </div>
          )}

          {/* Chart Section */}
          <div className="mt-8 rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4 md:p-5">
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
                      <div className="flex h-[400px] items-center justify-center rounded-lg bg-white/10 shadow-md backdrop-blur-sm">
                      <div className="text-center text-white/70">
                        <AlertTriangle size={48} className="mx-auto mb-2 text-white/70" />
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
              <div className="mt-8 rounded-lg bg-white/15 p-4 shadow-lg backdrop-blur-md">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  My Orders
                </h3>
                <div className="overflow-hidden rounded-lg">
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
            <div className="mt-8 flex items-center gap-2.5 rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-3 text-orange-400 shadow-md backdrop-blur-sm sm:gap-3 sm:p-4">
              <AlertTriangle
                size={18}
                className="flex-shrink-0 sm:h-5 sm:w-5"
              />
              <div className="text-xs sm:text-sm">
                This combinatorial market doesn't have a liquidity pool and
                therefore cannot be traded
              </div>
            </div>
          )}

          {/* Asset Details Table */}
          <div className="mt-8">
            <div className="rounded-lg bg-white/15 shadow-lg backdrop-blur-md">
              <div className="overflow-hidden rounded-lg">
                <ComboAssetDetails
                  combinations={comboMarketData.outcomeCombinations}
                  poolId={poolId}
                  baseAsset={comboMarketData.baseAsset}
                  virtualMarket={virtualMarket}
                  sourceMarkets={comboMarketData.sourceMarkets}
                />
              </div>
            </div>
          </div>

          {/* Market Description */}
          {/* <div className="mb-12 max-w-[90vw]">
            <MarketDescription market={virtualMarket} />
          </div> */}

          {/* Latest Trades */}
          {marketHasPool && (
            <div className="mt-8 rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4">
              <h3 className="mb-3 text-base font-semibold text-white sm:mb-4 sm:text-lg">
                Latest Trades
              </h3>
              <div className="pb-3 sm:pb-4">
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
            </div>
          )}

          {/* Liquidity Section */}
          {marketHasPool && (
            <div className="mt-8">
              <div
                className="mb-3 flex cursor-pointer items-center rounded-lg bg-white/15 px-3 py-2.5 text-sm font-semibold text-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-xl sm:mb-4 sm:px-4 sm:py-3 sm:text-base"
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
                <div className="rounded-lg bg-white/15 p-4 shadow-lg backdrop-blur-md">
                  <MarketLiquiditySection
                    pool={true}
                    market={virtualMarket}
                    comboMarket={true}
                  />
                </div>
              </Transition>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:block md:w-[320px] lg:w-[400px] xl:w-[460px]">
          <div className="sticky">
            {comboMarketIsActive ? (
              <div
                className="mb-12 animate-pop-in rounded-lg opacity-0 shadow-lg bg-white/15 backdrop-blur-md"
              >
                <Amm2TradeForm
                  marketId={0}
                  poolData={comboMarketData}
                  outcomeCombinations={comboMarketData?.outcomeCombinations}
                />
              </div>
            ) : comboMarketIsResolved ? (
              <div className="mb-12 rounded-lg bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4 md:p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Redeem Your Tokens
                </h3>
                <p className="mb-6 text-sm text-white/90">
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

                      const vm = virtualMarket as VirtualMarket;
                      const isParentScalar = vm.neoPool?.isParentScalar ?? false;
                      const isChildScalar = vm.neoPool?.isChildScalar ?? false;

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
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 p-4 shadow-md backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-none"
                            style={{ backgroundColor: combo.color }}
                          />
                          <span className="font-medium text-white">{combo.name}</span>
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
                  <div className="mt-6 rounded-lg border border-white/10 bg-white/10 p-4 shadow-md backdrop-blur-sm">
                    <h4 className="mb-2 text-sm font-semibold text-white">
                      To Get Your Collateral Back:
                    </h4>
                    <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-white/90">
                      <li>
                        <strong>Redeem tokens on this page</strong> → receive
                        Market 1 ("Assume" market) tokens
                      </li>
                      <li>
                        <strong>Redeem Market 1 tokens</strong> on the Market 1
                        page → receive your collateral
                      </li>
                    </ol>
                    <p className="text-xs text-white/80">
                      💡 <strong>Tip:</strong> Redeeming here is only the first
                      step. Visit Market 1 (the "Assume" market) to complete
                      your redemption and recover your collateral.
                    </p>
                  </div>
                </div>
              </div>
            ) : childMarketResolved ? (
              <div className="mb-12 rounded-lg border-l-4 border-ztg-green-500/40 bg-white/15 p-3 shadow-lg backdrop-blur-md sm:p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg border border-ztg-green-400/40 bg-ztg-green-500/80 px-2 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                    Partial Redemption
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Available
                  </h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/90">
                  <span className="font-semibold text-ztg-green-400">Market 2 ("Then" market)</span> has resolved. You can redeem tokens for{" "}
                  <span className="font-semibold text-blue-400">Market 1 ("Assume" market)</span> tokens and use those for trading.
                </p>
                <div className="space-y-3">
                  {comboMarketData?.outcomeCombinations
                    ?.filter((combo) => {
                      // Get child market (marketIds[1]) resolved outcome
                      const childMarket = comboMarketData.sourceMarkets.find(
                        (m: FullMarketFragment) => m.marketId === comboMarketData.marketIds[1]
                      );

                      if (!childMarket || childMarket.resolvedOutcome === null || childMarket.resolvedOutcome === undefined) {
                        return false;
                      }

                      // If child market is scalar, show ALL combinations (blockchain calculates payouts)
                      const isChildScalar = childMarket.marketType?.scalar !== null;
                      if (isChildScalar) {
                        return true;
                      }

                      // For categorical child markets, filter by resolved outcome
                      const resolvedOutcomeIndex = typeof childMarket.resolvedOutcome === 'string'
                        ? parseInt(childMarket.resolvedOutcome)
                        : childMarket.resolvedOutcome;

                      if (resolvedOutcomeIndex === undefined || resolvedOutcomeIndex === null) {
                        return false;
                      }

                      const resolvedOutcomeName = childMarket.categories?.[resolvedOutcomeIndex]?.name;

                      // Only show combinations where market2Outcome matches the resolved outcome
                      return combo.market2Outcome === resolvedOutcomeName;
                    })
                    .map((combo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 p-3 shadow-md backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-none"
                            style={{ backgroundColor: combo.color }}
                          />
                          <span className="text-sm font-medium text-white">
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
              <div className="mb-12 rounded-lg border-2 border-orange-500/40 bg-orange-900/30 p-6 text-center shadow-lg backdrop-blur-sm">
                <AlertTriangle
                  className="mx-auto mb-3 text-orange-400"
                  size={32}
                />
                <h3 className="mb-2 text-lg font-semibold text-white">Trading Closed</h3>
                <p className="text-sm text-orange-400">
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
