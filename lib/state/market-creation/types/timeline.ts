import * as O from "@zeitgeistpm/utility/dist/option";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";
import { PeriodOption, durationasBlocks } from "./form";

export type BlockTimeline = {
  market: { end: number };
  grace: { period: number; end: number };
  report: { period: number; end: number };
  dispute: { period: number; end: number };
};

export const timelineAsBlocks = (
  periods: {
    marketEndDate?: Date;
    gracePeriod: Partial<PeriodOption>;
    reportingPeriod: Partial<PeriodOption>;
    disputePeriod: Partial<PeriodOption>;
  },
  chainTime?: ChainTime,
): O.IOption<BlockTimeline> => {
  return O.tryCatch(() => {
    if (!chainTime) return null;

    const marketEndDate = new Date(periods.marketEndDate);
    const marketEndBlock = dateBlock(chainTime, marketEndDate);

    const gracePeriodEndBlock =
      periods.gracePeriod?.type === "date"
        ? periods.gracePeriod?.block
        : marketEndBlock + durationasBlocks(periods.gracePeriod);

    const reportPeriodEndBlock =
      periods.reportingPeriod?.type === "date"
        ? periods.reportingPeriod?.block
        : gracePeriodEndBlock + durationasBlocks(periods.reportingPeriod);

    const disputePeriodEndBlock =
      periods.disputePeriod?.type === "date"
        ? periods.disputePeriod?.block
        : reportPeriodEndBlock + durationasBlocks(periods.disputePeriod);

    const graceDelta = gracePeriodEndBlock - marketEndBlock;
    const reportDelta = reportPeriodEndBlock - gracePeriodEndBlock;
    const disputeDelta = disputePeriodEndBlock - reportPeriodEndBlock;

    return {
      market: { end: marketEndBlock },
      grace: { period: graceDelta, end: gracePeriodEndBlock },
      report: { period: reportDelta, end: reportPeriodEndBlock },
      dispute: { period: disputeDelta, end: disputePeriodEndBlock },
    };
  }).bind(O.fromNullable);
};
