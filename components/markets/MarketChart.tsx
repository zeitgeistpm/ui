import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, {
  ChartData,
  ChartSeries,
} from "components/ui/TimeSeriesChart";
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
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[0]);

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
