import { Tab } from "@headlessui/react";
import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, AssetId, ZTG } from "@zeitgeistpm/sdk";
import LatestTrades from "components/front-page/LatestTrades";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import { MarketDescription } from "components/markets/MarketDescription";
import MarketHeader from "components/markets/MarketHeader";
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
import {
  useComboMarket,
} from "lib/hooks/queries/useComboMarket";
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
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import NotFoundPage from "pages/404";
import { useState, useMemo } from "react";
import { AlertTriangle, ChevronDown, ExternalLink, X } from "react-feather";
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
}: {
  combinations: OutcomeCombination[];
  poolId: number;
  baseAsset: AssetId;
  virtualMarket: FullMarketFragment;
}) => {

  // Fetch prices with the virtualMarket
  const { data: spotPrices } = useMarketSpotPrices(
    poolId,
    0,
    virtualMarket
  );

  const { data: priceChanges } = useMarket24hrPriceChanges(
    poolId,
    virtualMarket
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
    {
      header: "24Hr Change",
      accessor: "change",
      type: "change",
      width: "120px",
      collapseOrder: 2,
    },
  ];

  // Build table data from combinations
  const tableData: TableData[] | undefined = combinations?.map(
    (combination, index) => {
      const currentPrice = spotPrices?.get(index)?.toNumber();
      const priceChange = priceChanges?.get(index);

      return {
        assetId: index,
        id: index,
        outcome: (
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: combination.color }}
            />
            <span className="font-medium">{combination.name}</span>
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
        change: priceChange,
      };
    },
  );

  return <Table columns={columns} data={tableData} />;
};

// Source markets section styled like market description with token balances
const SourceMarketsSection = ({
  sourceMarkets,
}: {
  sourceMarkets: [FullMarketFragment, FullMarketFragment];
}) => {
  const wallet = useWallet();

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold">Source Markets</h3>
      <div className="space-y-4">
        {sourceMarkets.map((market, index) => (
          <SourceMarketCard key={market.marketId} market={market} index={index} walletAddress={wallet.realAddress} />
        ))}
      </div>
    </div>
  );
};

// Individual source market card with balance display
const SourceMarketCard = ({
  market,
  index,
  walletAddress,
}: {
  market: FullMarketFragment;
  index: number;
  walletAddress?: string;
}) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
          Market {index + 1} (ID: {market.marketId})
        </span>
        <Link
          href={`/markets/${market.marketId}`}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          View Market <ExternalLink size={14} className="ml-1" />
        </Link>
      </div>
      <h4 className="mb-2 line-clamp-2 font-medium">{market.question}</h4>
      <div className="text-sm text-gray-500">
        <div className="mb-1">
          <span className="font-medium">Base Asset:</span>{" "}
          {market.baseAsset}
        </div>
      </div>

      {/* Token balances section */}
      {walletAddress && market.categories && (
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 text-xs font-medium text-gray-600">Your Token Balances:</div>
          <div className="space-y-2">
            {market.outcomeAssets?.map((assetString, outcomeIndex) => {
              const assetId = parseAssetIdStringWithCombinatorial(assetString);
              return assetId ? (
                <OutcomeBalance
                  key={outcomeIndex}
                  assetId={assetId}
                  walletAddress={walletAddress}
                  outcomeName={market.categories?.[outcomeIndex]?.name || `Outcome ${outcomeIndex}`}
                  color={market.categories?.[outcomeIndex]?.color}
                />
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display individual outcome balance
const OutcomeBalance = ({
  assetId,
  walletAddress,
  outcomeName,
  color,
}: {
  assetId: AssetId;
  walletAddress: string;
  outcomeName: string;
  color?: string;
}) => {

  const { data: balance } = useBalance(walletAddress, assetId);
  const balanceDisplay = balance?.div(ZTG).toFixed(2) || "0.00";

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {color && (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-gray-700">{outcomeName}</span>
      </div>
      <span className="font-medium text-gray-900">{balanceDisplay}</span>
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
  poolData,
}: {
  chartSeries: ChartSeries[];
  poolId: number;
  baseAsset?: AssetId;
  poolData?: any; // Pool data to get creation date
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[1]);
  
  const baseAssetId = baseAsset;
  const { data: metadata } = useAssetMetadata(baseAssetId);
  
  const startDateISOString = useMemo(() => {
    if (poolData?.createdAt) {
      // Use proper pool creation date with chart filter calculation
      const startDate = calcPriceHistoryStartDate(
        "Active" as any, // Combo pools are active when created
        chartFilter,
        poolData.createdAt,
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default future resolution date
      );
      return setTimeToNow(startDate).toISOString();
    }
    
    // Fallback to 30 days ago if no creation date
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }, [chartFilter.label, poolData?.createdAt]);

  const priceHistoryQuery = useComboMarketPriceHistory(
    poolId,
    chartFilter.intervalUnit,
    chartFilter.intervalValue,
    startDateISOString,
  );
  
  const { data: prices, isLoading, isSuccess } = priceHistoryQuery;
  
  const chartData = isSuccess && prices
    ? prices
        .filter((data) => data.prices.every((p) => p.price != null))
        .map((price) => {
          const time = new Date(price.timestamp).getTime();
          
          // Map prices to chart data format
          const assetPrices = price.prices.reduce((obj, val, index) => {
            // Ensure prices don't exceed 1
            return { ...obj, ["v" + index]: val.price > 1 ? 1 : val.price };
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
  const colors = chartSeries.map(s => s.color || "#000");
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

const MobileContextButtons = ({ poolId, comboMarketData }: { poolId: number; comboMarketData: any }) => {
  const { data: tradeItem, set: setTradeItem } = useTradeItem();
  const [open, setOpen] = useState(false);
  const [showPartialRedeem, setShowPartialRedeem] = useState(false);

  // Check if combo market is active (both source markets must be Active)
  const comboMarketIsActive = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Active
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if combo market is resolved (both source markets must be Resolved)
  const comboMarketIsResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Resolved
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if child market (last in marketIds) is resolved AND parent is still active
  const childMarketResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets || !comboMarketData?.marketIds) return false;
    const childMarketId = comboMarketData.marketIds[1];
    const parentMarketId = comboMarketData.marketIds[0];
    const childMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === childMarketId
    );
    const parentMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === parentMarketId
    );
    return childMarket?.status === MarketStatus.Resolved &&
           parentMarket?.status === MarketStatus.Active;
  }, [comboMarketData?.sourceMarkets, comboMarketData?.marketIds]);

  // Get virtual market for redeem button
  const marketIds = comboMarketData?.marketIds;
  const virtualMarket = useVirtualMarket(poolId, marketIds);
  console.log(virtualMarket);
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
              tradeItem?.action === "buy" ? TradeTabType.Buy : TradeTabType.Sell
            }
            outcomeCombinations={comboMarketData?.outcomeCombinations}
          />
        ) : comboMarketIsResolved && virtualMarket ? (
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Redeem Your Tokens</h3>
            <p className="mb-6 text-sm text-gray-600">
              Both source markets have been resolved. Redeem your outcome tokens below.
            </p>
            <div className="space-y-4">
              {comboMarketData?.outcomeCombinations?.map((combo, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-4">
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
                  />
                </div>
              ))}
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
            <h3 className="mb-2 text-lg font-semibold text-blue-900">Partial Redemption Available</h3>
            <p className="mb-4 text-sm text-blue-700">
              You can redeem tokens for the child market and use those tokens for trading
            </p>
            <div className="space-y-3">
              {comboMarketData?.outcomeCombinations?.map((combo, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
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
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {comboMarketIsActive ? (
          <div className="flex h-20 cursor-pointer text-lg font-semibold">
            <div
              className={`center h-full flex-1  ${
                tradeItem?.action === "buy"
                  ? "bg-fog-of-war text-gray-200"
                  : "bg-white text-black"
              } `}
              onClick={() => {
                setTradeItem({
                  assetId: tradeItem?.assetId ?? ({} as MarketOutcomeAssetId),
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
                  assetId: tradeItem?.assetId ?? ({} as MarketOutcomeAssetId),
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

const ComboMarket: NextPage<ComboMarketPageProps> = ({ poolId }) => {
  const { realAddress } = useWallet();
  const { data: comboMarketData, isLoading } = useComboMarket(poolId);
  const { data: orders, isLoading: isOrdersLoading } = useOrders({
    marketId_eq: poolId,
    makerAccountId_eq: realAddress,
  });
  const { data: poolData } = useAmm2Pool(0, poolId); // marketId=0 for combo pools
  const { data: parentCollectionIds } = useNeoPoolParentCollectionIds(poolId);
  console.log(parentCollectionIds);
  // Extract market IDs from combo market data
  const marketIds = comboMarketData?.marketIds;

  // Use the virtual market hook with marketIds
  const virtualMarket = useVirtualMarket(poolId, marketIds);

  // Get market stages for source markets to determine combo pool stage
  const { data: market1Stage } = useMarketStage(comboMarketData?.sourceMarkets?.[0] as any);
  const { data: market2Stage } = useMarketStage(comboMarketData?.sourceMarkets?.[1] as any);

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
      }
    ];
  }, [market1Stage, market2Stage, comboMarketData]);

  // Check if combo market should allow trading (both source markets must be Active)
  const comboMarketIsActive = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Active
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if combo market is resolved (both source markets must be Resolved)
  const comboMarketIsResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets) return false;
    return comboMarketData.sourceMarkets.every(
      (market: FullMarketFragment) => market.status === MarketStatus.Resolved
    );
  }, [comboMarketData?.sourceMarkets]);

  // Check if child market (last in marketIds) is resolved AND parent is still active
  // This allows partial redemption when child resolves first, but parent market continues
  const childMarketResolved = useMemo(() => {
    if (!comboMarketData?.sourceMarkets || !comboMarketData?.marketIds) return false;
    const childMarketId = comboMarketData.marketIds[1]; // Last market ID is the child
    const parentMarketId = comboMarketData.marketIds[0]; // First market ID is the parent
    const childMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === childMarketId
    );
    const parentMarket = comboMarketData.sourceMarkets.find(
      (m: FullMarketFragment) => m.marketId === parentMarketId
    );
    // Only show partial redemption if child is resolved AND parent is still active
    return childMarket?.status === MarketStatus.Resolved &&
           parentMarket?.status === MarketStatus.Active;
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
          <MarketMeta market={virtualMarket} />

          <MarketHeader
            market={virtualMarket as any}
            token="ZTG" // Combo markets use ZTG as base asset
            poolId={poolId}
            sourceMarketStages={sourceMarketStages}
          />

          {/* Combinatorial Market Badge */}
          <div className="my-4">
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              Combinatorial Market
            </span>
          </div>

          {/* Chart Section */}
          <div className="mt-4">
            <Tab.Group defaultIndex={0}>
              <Tab.List className="flex gap-2 text-sm">
              </Tab.List>

              <Tab.Panels className="mt-2">
                <Tab.Panel>
                  {hasChart ? (
                    <ComboChart 
                      chartSeries={chartSeries} 
                      poolId={poolId}
                      baseAsset={comboMarketData.baseAsset}
                      poolData={poolData}
                    />
                  ) : (
                    <div className="flex h-[400px] items-center justify-center rounded-lg bg-gray-100">
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
              <div className="mt-3 flex flex-col gap-y-3">
                <div>My Orders</div>
                <OrdersTable
                  where={{
                    marketId_eq: poolId,
                    makerAccountId_eq: realAddress,
                  }}
                />
              </div>
            )}

          {/* No Pool Warning */}
          {!marketHasPool && (
            <div className="flex h-ztg-22 items-center rounded-ztg-5 bg-vermilion-light p-ztg-20 text-vermilion">
              <div className="h-ztg-20 w-ztg-20">
                <AlertTriangle size={20} />
              </div>
              <div className="ml-ztg-10 text-ztg-12-120">
                This combinatorial market doesn't have a liquidity pool and
                therefore cannot be traded
              </div>
            </div>
          )}

          {/* Asset Details Table */}
          <div className="my-8">
            <ComboAssetDetails
              combinations={comboMarketData.outcomeCombinations}
              poolId={poolId}
              baseAsset={comboMarketData.baseAsset}
              virtualMarket={virtualMarket}
            />
          </div>

          {/* Market Description */}
          <div className="mb-12 max-w-[90vw]">
            <MarketDescription market={virtualMarket} />
          </div>

          {/* Source Markets Section */}
          <SourceMarketsSection sourceMarkets={comboMarketData.sourceMarkets} />

          {/* Latest Trades */}
          {marketHasPool && (
            <div className="mt-10 flex flex-col gap-4">
              <h3 className="mb-5 text-2xl">Latest Trades</h3>
              <LatestTrades
                limit={3}
                marketId={undefined}
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
              />
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
                show={showLiquidity && Boolean(marketHasPool)}
              >
                <MarketLiquiditySection
                  pool={true}
                  market={virtualMarket}
                  comboMarket={true}
                />
              </Transition>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:-mr-6 md:block md:w-[320px] lg:mr-auto lg:w-[460px]">
          <div className="sticky top-28">
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
                <h3 className="mb-4 text-lg font-semibold">Redeem Your Tokens</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Both source markets have been resolved. Redeem your outcome tokens below.
                </p>
                <div className="space-y-4">
                  {comboMarketData?.outcomeCombinations?.map((combo, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-4">
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
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : childMarketResolved ? (
              <div className="mb-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 shadow-lg">
                <h3 className="mb-2 text-lg font-semibold text-blue-900">Partial Redemption Available</h3>
                <p className="mb-4 text-sm text-blue-700">
                  You can redeem tokens for the child market and use those tokens for trading
                </p>
                <div className="space-y-3">
                  {comboMarketData?.outcomeCombinations?.map((combo, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3">
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
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-12 rounded-lg bg-gray-100 p-6 text-center shadow-lg">
                <AlertTriangle className="mx-auto mb-3 text-orange-500" size={32} />
                <h3 className="mb-2 text-lg font-semibold">Trading Closed</h3>
                <p className="text-sm text-gray-600">
                  This combinatorial market is closed because one or more source markets have ended.
                </p>
              </div>
            )}
            <SimilarMarketsSection market={virtualMarket} />
          </div>
        </div>
      </div>
      <MobileContextButtons poolId={poolId} comboMarketData={comboMarketData} />
    </div>
  );
};

export default ComboMarket;
