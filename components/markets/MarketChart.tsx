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
  console.log(prices)
  const chartData = prices
    ?.filter((data) => data.prices.every((p) => p.price != null))
    .map((price) => {
      const time = new Date(price.timestamp).getTime();
      const assetPrices = price.prices.reduce((obj, val, index) => {
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
    <div className="-ml-ztg-25 flex flex-col">
      <div className="ml-auto">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
      </div>
      <TimeSeriesChart
        data={chartData}
        series={chartSeries.map((s, i) => ({ ...s, color: colors[i] }))}
        yUnits={metadata?.symbol ?? ""}
        isLoading={isLoading}
      />
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
      const shortPrice = price.prices[1].price;
      const longPrice = price.prices[0].price;
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
    <div className="-ml-ztg-25 flex flex-col">
      <div className="ml-auto">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
      </div>
      <TimeSeriesChart
        data={chartData}
        series={[series]}
        yUnits={"Prediction"}
        yDomain={[lowerBound, upperBound]}
        isLoading={isLoading}
      />
    </div>
  );
};
