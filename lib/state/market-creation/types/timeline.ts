import * as O from "@zeitgeistpm/utility/dist/option";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";
import { PartialMarketFormData, durationasBlocks } from "./form";

export type BlockTimeline = {
  market: { end: number };
  grace: { period: number; end: number };
  report: { period: number; end: number };
  dispute: { period: number; end: number };
};

export const timelineAsBlocks = (
  form: Pick<
    PartialMarketFormData,
    "endDate" | "gracePeriod" | "disputePeriod" | "reportingPeriod"
  >,
  chainTime?: ChainTime,
): O.IOption<BlockTimeline> => {
  return O.tryCatch(() => {
    if (!chainTime) throw new Error("No chain time provided");
    if (!form?.endDate) throw new Error("No end date provided");

    const marketEndDate = new Date(form?.endDate);
    const marketEndBlock = dateBlock(chainTime, marketEndDate);

    const gracePeriodEndBlock =
      form.gracePeriod?.type === "date"
        ? form.gracePeriod?.block
        : marketEndBlock +
          (form.gracePeriod ? durationasBlocks(form.gracePeriod) : 0);

    const reportPeriodEndBlock =
      form.reportingPeriod?.type === "date"
        ? form.reportingPeriod?.block
        : gracePeriodEndBlock +
          (form.reportingPeriod ? durationasBlocks(form.reportingPeriod) : 0);

    const disputePeriodEndBlock =
      form.disputePeriod?.type === "date"
        ? form.disputePeriod?.block
        : reportPeriodEndBlock +
          (form.disputePeriod ? durationasBlocks(form.disputePeriod) : 0);

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
