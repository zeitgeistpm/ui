import { MarketStatus, parseAssetId } from "@zeitgeistpm/sdk";
import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
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
    ?.filter((data) => {
      // Ensure prices exist and are valid numbers
      return (
        data.prices &&
        data.prices.length > 0 &&
        data.prices.every(
          (p) => p.price != null && !isNaN(Number(p.price)) && isFinite(Number(p.price)),
        )
      );
    })
    .map((price) => {
      const time = new Date(price.timestamp).getTime();
      let orderedPrices = price.prices;

      if (market?.outcomeAssets && market.outcomeAssets.length > 0) {
        const firstAsset = market.outcomeAssets[0];
        const isCombinatorialMarket =
          typeof firstAsset === "string" &&
          (firstAsset.includes("combinatorialToken") ||
            firstAsset.startsWith("0x"));

        if (isCombinatorialMarket) {
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
        const priceValue = Number(val.price);
        // Validate price is a valid number before using it
        if (isNaN(priceValue) || !isFinite(priceValue)) {
          return obj;
        }
        // adjust prices over 1
        return { ...obj, ["v" + index]: priceValue > 1 ? 1 : priceValue };
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
    }) as ChartData[] | undefined;

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
    ?.filter((data) => {
      // Ensure we have at least 2 prices (long and short)
      if (!data.prices || data.prices.length < 2) return false;
      // Ensure all prices are valid numbers
      return data.prices.every((p) => p.price != null && !isNaN(Number(p.price)));
    })
    .map((price) => {
      const time = new Date(price.timestamp).getTime();
      const shortPrice = price.prices[1]?.price;
      const longPrice = price.prices[0]?.price;

      // Validate prices exist and are valid numbers
      if (
        shortPrice == null ||
        longPrice == null ||
        isNaN(Number(shortPrice)) ||
        isNaN(Number(longPrice))
      ) {
        return null;
      }

      const prediction =
        (Number(upperBound) - Number(lowerBound)) *
          ((1 - Number(shortPrice) + Number(longPrice)) / 2) +
        Number(lowerBound);

      // Filter out NaN results
      if (isNaN(prediction)) {
        return null;
      }

      return {
        t: time,
        prediction,
      };
    })
    .filter((data) => data != null) as ChartData[] | undefined;

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
