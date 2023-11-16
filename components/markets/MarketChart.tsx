import { MarketStatus, parseAssetId } from "@zeitgeistpm/sdk";
import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, { ChartSeries } from "components/ui/TimeSeriesChart";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
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

const MarketChart = ({
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
    <div className="flex flex-col -ml-ztg-25">
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
export default MarketChart;
