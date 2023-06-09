import { MarketStatus } from "@zeitgeistpm/sdk-next";
import { TimeFilter } from "components/ui/TimeFilters";

export const calcPriceHistoryStartDate = (
  marketStatus: MarketStatus,
  chartFilter: TimeFilter,
  poolCreationDate: Date,
  resolutionDate: Date,
) => {
  if (chartFilter.label === "All") return poolCreationDate;
  if (marketStatus === "Resolved" && resolutionDate) {
    const startDate = resolutionDate.getTime() - chartFilter.timePeriodMS!;

    return startDate > poolCreationDate.getTime()
      ? new Date(startDate)
      : poolCreationDate;
  } else {
    const now = new Date();

    const startDate = now.getTime() - chartFilter.timePeriodMS!;

    return startDate > poolCreationDate.getTime()
      ? new Date(startDate)
      : poolCreationDate;
  }
};
