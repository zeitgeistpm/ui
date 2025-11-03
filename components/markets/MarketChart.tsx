import { MarketStatus, parseAssetId } from "@zeitgeistpm/sdk";
import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, { ChartSeries } from "components/ui/TimeSeriesChart";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketPriceHistory } from "lib/hooks/queries/useMarketPriceHistory";
import { calcPriceHistoryStartDate } from "lib/util/calc-price-history-start";
import { calcMarketColors } from "lib/util/color-calc";
import { useMemo, useState } from "react";

const setTimeToNow = (date: Date) => {
  const now = new Date();
  date.setHours(now.getHours());
  date.setMinutes(now.getMinutes());
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

export const CategoricalMarketChart = ({
  marketId,
  chartSeries,
  baseAsset,
  marketStatus,
  resolutionDate,
  poolCreationDate,
}: {
  marketId: number;
  chartSeries: ChartSeries[];
  baseAsset?: string;
  poolCreationDate: Date;
  marketStatus: MarketStatus;
  resolutionDate: Date;
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[1]);
  const { data: market } = useMarket({ marketId });

  const baseAssetId = parseAssetId(baseAsset).unrightOr(undefined);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const startDateISOString = useMemo(() => {
    const startDate = calcPriceHistoryStartDate(
      marketStatus,
      chartFilter,
      poolCreationDate,
      resolutionDate,
    );

    return setTimeToNow(startDate).toISOString();
  }, [chartFilter.label]);

  const { data: prices, isLoading } = useMarketPriceHistory(
    marketId,
    chartFilter.intervalUnit,
    chartFilter.intervalValue,
    //hack to make data end on same time as now
    startDateISOString,
  );

  const chartData = prices
    ?.filter((data) => data.prices.every((p) => p.price != null))
    .map((price) => {
      const time = new Date(price.timestamp).getTime();

      // For combinatorial markets, we need to ensure the price data order matches the category order
      let orderedPrices = price.prices;

      if (market?.outcomeAssets && market.outcomeAssets.length > 0) {
        // Check if this is a combinatorial market
        const firstAsset = market.outcomeAssets[0];
        const isCombinatorialMarket =
          typeof firstAsset === "string" &&
          (firstAsset.includes("combinatorialToken") ||
            firstAsset.startsWith("0x"));

        if (isCombinatorialMarket) {
          // Sort the price data to match market.outcomeAssets order
          // This ensures v0, v1, etc. correspond to the correct category indices
          orderedPrices = [...price.prices].sort((a, b) => {
            const aIndex = market.outcomeAssets.findIndex(
              (marketAsset: any) => {
                if (typeof marketAsset === "string") {
                  try {
                    const parsed = JSON.parse(marketAsset);
                    return (
                      parsed.combinatorialToken &&
                      a.assetId.includes(parsed.combinatorialToken)
                    );
                  } catch {
                    return false;
                  }
                }
                return a.assetId.includes(JSON.stringify(marketAsset));
              },
            );

            const bIndex = market.outcomeAssets.findIndex(
              (marketAsset: any) => {
                if (typeof marketAsset === "string") {
                  try {
                    const parsed = JSON.parse(marketAsset);
                    return (
                      parsed.combinatorialToken &&
                      b.assetId.includes(parsed.combinatorialToken)
                    );
                  } catch {
                    return false;
                  }
                }
                return b.assetId.includes(JSON.stringify(marketAsset));
              },
            );

            return aIndex - bIndex;
          });
        }
      }

      const assetPrices = orderedPrices.reduce((obj, val, index) => {
        // adjust prices over 1
        return { ...obj, ["v" + index]: val.price > 1 ? 1 : val.price };
      }, {});

      return {
        t: time,
        ...assetPrices,
      };
    });

  const handleFilterChange = (filter: TimeFilter) => {
    setChartFilter(filter);
  };

  const colors = calcMarketColors(marketId, chartSeries.length);
  return (
    <div className="flex flex-col">
      <TimeSeriesChart
        data={chartData}
        series={chartSeries.map((s, i) => ({ ...s, color: colors[i] }))}
        yUnits={metadata?.symbol ?? ""}
        isLoading={isLoading}
      />
      <div className="mt-2 w-full sm:mt-3">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
      </div>
    </div>
  );
};

export const ScalarMarketChart = ({
  marketId,
  marketStatus,
  resolutionDate,
  poolCreationDate,
}: {
  marketId: number;
  poolCreationDate: Date;
  marketStatus: MarketStatus;
  resolutionDate: Date;
}) => {
  const { data: market } = useMarket({ marketId });
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[1]);

  const startDateISOString = useMemo(() => {
    const startDate = calcPriceHistoryStartDate(
      marketStatus,
      chartFilter,
      poolCreationDate,
      resolutionDate,
    );

    return setTimeToNow(startDate).toISOString();
  }, [chartFilter.label]);

  const lowerBound = Number(market?.marketType.scalar?.[0]) / ZTG;
  const upperBound = Number(market?.marketType.scalar?.[1]) / ZTG;

  const { data: prices, isLoading } = useMarketPriceHistory(
    marketId,
    chartFilter.intervalUnit,
    chartFilter.intervalValue,
    //hack to make data end on same time as now
    startDateISOString,
  );

  const chartData = prices
    ?.filter((data) => data.prices.every((p) => p.price != null))
    .map((price) => {
      const time = new Date(price.timestamp).getTime();
      const shortPrice = price.prices[1]?.price;
      const longPrice = price.prices[0]?.price;
      const prediction =
        (Number(upperBound) - Number(lowerBound)) *
          ((1 - shortPrice + longPrice) / 2) +
        lowerBound;

      return {
        t: time,
        prediction,
      };
    });

  const handleFilterChange = (filter: TimeFilter) => {
    setChartFilter(filter);
  };

  const series: ChartSeries = {
    accessor: "prediction",
    label: "",
    color: "#2468e2",
  };
  return (
    <div className="flex flex-col">
      <TimeSeriesChart
        data={chartData}
        series={[series]}
        yUnits={"Prediction"}
        yDomain={[lowerBound, upperBound]}
        isLoading={isLoading}
      />
      <div className="mt-2 w-full sm:mt-3">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
      </div>
    </div>
  );
};
