import { Tab } from "@headlessui/react";
import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, parseAssetId, AssetId } from "@zeitgeistpm/sdk";
import LatestTrades from "components/front-page/LatestTrades";
import { MarketLiquiditySection } from "components/liquidity/MarketLiquiditySection";
import { AddressDetails } from "components/markets/MarketAddresses";
import { MarketDescription } from "components/markets/MarketDescription";
import MarketHeader from "components/markets/MarketHeader";
import MarketMeta from "components/meta/MarketMeta";
import OrdersTable from "components/orderbook/OrdersTable";
import Amm2TradeForm from "components/trade-form/Amm2TradeForm";
import { TradeTabType } from "components/trade-form/TradeTab";
import Table, { TableColumn, TableData } from "components/ui/Table";
import TimeSeriesChart, { ChartSeries } from "components/ui/TimeSeriesChart";
import TimeFilters, { TimeFilter } from "components/ui/TimeFilters";
import { useMarketPriceHistory } from "lib/hooks/queries/useMarketPriceHistory";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import Skeleton from "components/ui/Skeleton";
import { Transition } from "@headlessui/react";
import Decimal from "decimal.js";
import {
  useComboMarket,
  OutcomeCombination,
} from "lib/hooks/queries/useComboMarket";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useMarket24hrPriceChanges } from "lib/hooks/queries/useMarket24hrPriceChanges";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useTradeItem } from "lib/hooks/trade";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useWallet } from "lib/state/wallet";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import NotFoundPage from "pages/404";
import { useState } from "react";
import { AlertTriangle, ChevronDown, ExternalLink, X } from "react-feather";

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
  virtualMarket?: FullMarketFragment;
}) => {

  const { data: spotPrices } = useMarketSpotPrices(poolId, 0, virtualMarket);
  const { data: priceChanges } = useMarket24hrPriceChanges(poolId, virtualMarket);
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
          currentPrice != null
            ? Math.round((currentPrice / totalAssetPrice.toNumber()) * 100)
            : null,
        change: priceChange,
      };
    },
  );
  return <Table columns={columns} data={tableData} />;
};

// Source markets section styled like market description
const SourceMarketsSection = ({
  sourceMarkets,
}: {
  sourceMarkets: [FullMarketFragment, FullMarketFragment];
}) => {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold">Source Markets</h3>
      <div className="space-y-4">
        {sourceMarkets.map((market, index) => (
          <div
            key={market.marketId}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
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
                <span className="font-medium">Outcomes:</span>{" "}
                {market.categories?.map((cat) => cat.name).join(", ")}
              </div>
              <div>
                <span className="font-medium">Base Asset:</span>{" "}
                {market.baseAsset}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility function to find combined period from source markets
const getCombinedMarketPeriod = (
  sourceMarkets: [FullMarketFragment, FullMarketFragment],
): { block: string[]; start: string; end: string } => {
  let earliestStart: string | null = null;
  let latestEnd: string | null = null;

  sourceMarkets.forEach((market) => {
    if (market.period) {
      // Extract start and end from market period
      const marketStart = market.period.start;
      const marketEnd = market.period.end;

      if (marketStart && marketEnd) {
        // Find earliest start
        if (!earliestStart || parseInt(marketStart) < parseInt(earliestStart)) {
          earliestStart = marketStart;
        }

        // Find latest end
        if (!latestEnd || parseInt(marketEnd) > parseInt(latestEnd)) {
          latestEnd = marketEnd;
        }
      }
    }
  });

  const start = earliestStart || "0";
  const end = latestEnd || "1000000000000";

  return {
    block: [start, end], // Include block format for compatibility
    start,
    end,
  };
};

// Chart component for combo markets
const ComboChart = ({ 
  chartSeries,
  poolId,
  baseAsset,
}: { 
  chartSeries: ChartSeries[];
  poolId: number;
  baseAsset?: AssetId;
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>({
    label: "All",
    intervalUnit: "Day",
    intervalValue: 1,
  });
  
  const baseAssetId = baseAsset;
  const { data: metadata } = useAssetMetadata(baseAssetId);
  
  // For combo markets, we use the poolId as marketId for price history
  const startDateString = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days ago

  const { data: prices, isLoading } = useMarketPriceHistory(
    poolId,
    chartFilter.intervalUnit,
    chartFilter.intervalValue,
    startDateString,
  );
  console.log(prices);
  const chartData = prices
    ?.filter((data) => data.prices.every((p) => p.price != null))
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
    });
  console.log(chartData);
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

const MobileContextButtons = ({ poolId }: { poolId: number }) => {
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
        <Amm2TradeForm
          marketId={poolId}
          showTabs={false}
          selectedTab={
            tradeItem?.action === "buy" ? TradeTabType.Buy : TradeTabType.Sell
          }
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Skeleton height="400px" width="100%" />
      </div>
    );
  }

  if (!comboMarketData) {
    return <NotFoundPage backText="Back To Markets" backLink="/markets" />;
  }
  // Create a virtual market object for components that expect a FullMarketFragment
  const virtualMarket = {
    marketId: poolId,
    question: comboMarketData.question,
    description: comboMarketData.description,
    status: MarketStatus.Active,
    oracle: comboMarketData.accountId, //TODO: fix to show all oracles or none
    categories: comboMarketData.outcomeCombinations.map((combo) => ({
      name: combo.name,
      color: combo.color,
    })),
    baseAsset: comboMarketData.baseAsset,
    outcomeAssets: comboMarketData.outcomeCombinations.map(
      (_, index) => `${poolId}-${index}`,
    ),
    pool: null,
    neoPool: {
      ...poolData,
    },
    slug: `combo-${poolId}`,
    __typename: "Market" as const,
    creation: "Proposed" as const,
    creator: comboMarketData.accountId,
    earlyClose: null,
    disputeMechanism: "Authorized" as const,
    hasValidMetaCategories: true,
    img: null,
    marketType: { categorical: null, scalar: null },
    period: getCombinedMarketPeriod(comboMarketData.sourceMarkets),
    resolvedOutcome: null,
    scalarType: null,
    tags: [],
    volume: "0",
    liquidity: poolData?.liquidity, // Default value since we don't have direct access
    report: null,
    disputes: [],
    rejectReason: null,
  } as unknown as FullMarketFragment;

  // Use chart series from combo market data
  const chartSeries = comboMarketData.chartSeries;

  const hasChart = Boolean(chartSeries && comboMarketData);
  const marketHasPool = true; // Combo markets always have pools
  console.log(virtualMarket);
  return (
    <div className="mt-6">
      <div className="relative flex flex-auto gap-12">
        <div className="flex-1 overflow-hidden">
          <MarketMeta market={virtualMarket} />

          <MarketHeader
            market={virtualMarket as any}
            token={comboMarketData.baseAsset?.toString() || "ZTG"}
          />

          {/* Combinatorial Market Badge */}
          <div className="mb-4">
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              🔗 Combinatorial Market
            </span>
          </div>

          {/* Chart Section */}
          <div className="mt-4">
            <Tab.Group defaultIndex={0}>
              <Tab.List className="flex gap-2 text-sm">
                <Tab className="rounded-md border-1 border-gray-400 px-2 py-1 ui-selected:border-transparent ui-selected:bg-gray-300">
                  Chart
                </Tab>
              </Tab.List>

              <Tab.Panels className="mt-2">
                <Tab.Panel>
                  {hasChart ? (
                    <ComboChart 
                      chartSeries={chartSeries} 
                      poolId={poolId}
                      baseAsset={comboMarketData.baseAsset}
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
              <Link
                className="w-full text-center text-ztg-blue"
                href={`/latest-trades?marketId=${poolId}`}
              >
                View more
              </Link>
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
            <div
              className="mb-12 animate-pop-in rounded-lg opacity-0 shadow-lg"
              style={{
                background:
                  "linear-gradient(180deg, rgba(49, 125, 194, 0.2) 0%, rgba(225, 210, 241, 0.2) 100%)",
              }}
            >
              <Amm2TradeForm
                marketId={poolId}
                poolData={comboMarketData}
                outcomeCombinations={comboMarketData?.outcomeCombinations}
              />
            </div>
            <SimilarMarketsSection market={virtualMarket} />
          </div>
        </div>
      </div>
      <MobileContextButtons poolId={poolId} />
    </div>
  );
};

export default ComboMarket;
