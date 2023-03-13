import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
import { useMarketPriceHistory } from "lib/hooks/queries/useMarketPriceHistory";
import { useMemo, useState } from "react";

const setTimeToNow = (date: Date) => {
  const now = new Date();
  date.setHours(now.getHours());
  date.setMinutes(now.getMinutes());

  return date;
};

const MarketChart = ({
  marketId,
  chartSeries,
  baseAsset,
  weeklyChartData,
  poolCreationDate,
}: {
  marketId: number;
  chartSeries: ChartSeries[];
  weeklyChartData: ChartData[];
  baseAsset: string;
  poolCreationDate: string;
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(
    filters[filters.length - 1],
  );
  const startDate = useMemo(() => {
    if (chartFilter.label === "All") {
      return poolCreationDate;
    } else {
      const filterDate = new Date(chartFilter.time);
      const poolDate = new Date(poolCreationDate);
      if (filterDate.getTime() > poolDate.getTime()) {
        return chartFilter.time;
      } else {
        return poolCreationDate;
      }
    }
  }, [chartFilter.label]);

  const { data: prices } = useMarketPriceHistory(
    marketId,
    chartFilter.interval,
    //hack to make data end on same time as now
    setTimeToNow(new Date(startDate)).toISOString(),
  );

  const chartData = prices?.map((price) => {
    const time = new Date(price.timestamp).getTime();
    const assetPrices = price.prices.reduce((obj, val, index) => {
      // adjust prices over 1
      return { ...obj, ["v" + index]: (val.price > 1 ? 1 : val.price) ?? 0 };
    }, {});

    return {
      t: time,
      ...assetPrices,
    };
  });

  return (
    <div className="flex flex-col -ml-ztg-25">
      <div className="ml-auto">
        <TimeFilters onClick={setChartFilter} value={chartFilter} />
      </div>
      <TimeSeriesChart
        data={chartData}
        series={chartSeries}
        yUnits={baseAsset}
      />
    </div>
  );
};
export default MarketChart;
