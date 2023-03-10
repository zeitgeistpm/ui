import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
import { useMarketPriceHistory } from "lib/hooks/queries/useMarketPriceHistory";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useState } from "react";

const MarketChart = ({
  chartSeries,
  chartData,
  baseAsset,
}: {
  chartSeries: ChartSeries[];
  chartData: ChartData[];
  baseAsset: string;
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(
    filters[filters.length - 1],
  );
  const { data: prices } = useMarketPriceHistory(567, chartFilter);
  // console.log(prices);

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
