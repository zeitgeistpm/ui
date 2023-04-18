import { MarketStatus } from "@zeitgeistpm/sdk-next";
import TimeFilters, { filters, TimeFilter } from "components/ui/TimeFilters";
import TimeSeriesChart, { ChartSeries } from "components/ui/TimeSeriesChart";
import {
  PriceHistory,
  useMarketPriceHistory,
} from "lib/hooks/queries/useMarketPriceHistory";
import { calcPriceHistoryStartDate } from "lib/util/calc-price-history-start";
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
  initialData,
  marketStatus,
  resolutionDate,
  poolCreationDate,
}: {
  marketId: number;
  chartSeries: ChartSeries[];
  baseAsset: string;
  initialData: PriceHistory[];
  poolCreationDate: Date;
  marketStatus: MarketStatus;
  resolutionDate: Date;
}) => {
  const [chartFilter, setChartFilter] = useState<TimeFilter>(filters[1]);
  const [filterSelected, setFilterSelected] = useState(false);

  const startDateISOString = useMemo(() => {
    const startDate = calcPriceHistoryStartDate(
      marketStatus,
      chartFilter,
      poolCreationDate,
      resolutionDate,
    );

    return setTimeToNow(startDate).toISOString();
  }, [chartFilter.label]);

  const { data: prices } = useMarketPriceHistory(
    marketId,
    chartFilter.resolutionUnit,
    chartFilter.resolutionValue,
    //hack to make data end on same time as now
    startDateISOString,
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
