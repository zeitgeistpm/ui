import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, { ChartSeries } from "components/ui/TimeSeriesChart";
import {
  PriceHistory,
  useMarketPriceHistory,
} from "lib/hooks/queries/useMarketPriceHistory";
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
  poolCreationDate,
  initialData,
}: {
  marketId: number;
  chartSeries: ChartSeries[];
  baseAsset: string;
  poolCreationDate: string;
  initialData: PriceHistory[];
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[1]);
  const [filterSelected, setFilterSelected] = useState(false);

  const startDate = useMemo(() => {
    if (chartFilter.label === "All") {
      return poolCreationDate;
    } else {
      const filterDate = new Date(chartFilter.startTime);
      const poolDate = new Date(poolCreationDate);
      if (filterDate.getTime() > poolDate.getTime()) {
        return chartFilter.startTime;
      } else {
        return poolCreationDate;
      }
    }
  }, [chartFilter.label]);

  const { data: prices } = useMarketPriceHistory(
    marketId,
    chartFilter.timeUnit,
    chartFilter.timeValue,
    //hack to make data end on same time as now
    setTimeToNow(new Date(startDate)).toISOString(),
  );

  const chartData = (filterSelected == false ? initialData : prices)?.map(
    (price) => {
      const time = new Date(price.timestamp).getTime();
      const assetPrices = price.prices.reduce((obj, val, index) => {
        // adjust prices over 1
        return { ...obj, ["v" + index]: (val.price > 1 ? 1 : val.price) ?? 0 };
      }, {});

      return {
        t: time,
        ...assetPrices,
      };
    },
  );

  const handleFilterChange = (filter: TimeFilter) => {
    setFilterSelected(true);
    setChartFilter(filter);
  };

  return (
    <div className="flex flex-col -ml-ztg-25">
      <div className="ml-auto">
        <TimeFilters onClick={handleFilterChange} value={chartFilter} />
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
