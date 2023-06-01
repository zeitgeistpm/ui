import * as O from "@zeitgeistpm/utility/dist/option";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";
import { PartialMarketFormData, PeriodOption, durationasBlocks } from "./form";

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
    if (!chainTime) return null;

    const marketEndDate = new Date(form.endDate);
    const marketEndBlock = dateBlock(chainTime, marketEndDate);

    const gracePeriodEndBlock =
      form.gracePeriod?.type === "date"
        ? form.gracePeriod?.block
        : marketEndBlock + durationasBlocks(form.gracePeriod);

    const reportPeriodEndBlock =
      form.reportingPeriod?.type === "date"
        ? form.reportingPeriod?.block
        : gracePeriodEndBlock + durationasBlocks(form.reportingPeriod);

    const disputePeriodEndBlock =
      form.disputePeriod?.type === "date"
        ? form.disputePeriod?.block
        : reportPeriodEndBlock + durationasBlocks(form.disputePeriod);

    const graceDelta = gracePeriodEndBlock - marketEndBlock;
    const reportDelta = reportPeriodEndBlock - gracePeriodEndBlock;
    const disputeDelta = disputePeriodEndBlock - reportPeriodEndBlock;

    // if (!form.endDate) {
    //   console.group("timelineAsBlocks");
    //   console.log("chainTime", chainTime);
    //   console.log("periods.marketEndDate", form.endDate);
    //   console.log("marketEndDate", marketEndDate);
    //   console.log("marketEndBlock", marketEndBlock);
    //   console.log("gracePeriodEndBlock", gracePeriodEndBlock);
    //   console.log("reportPeriodEndBlock", reportPeriodEndBlock);
    //   console.log("disputePeriodEndBlock", disputePeriodEndBlock);
    //   console.log("graceDelta", graceDelta);
    //   console.log("reportDelta", reportDelta);
    //   console.log("disputeDelta", disputeDelta);
    //   console.groupEnd();
    // } else {
    //   console.log("timelineAsBlocks success");
    // }

    return {
      market: { end: marketEndBlock },
      grace: { period: graceDelta, end: gracePeriodEndBlock },
      report: { period: reportDelta, end: reportPeriodEndBlock },
      dispute: { period: disputeDelta, end: disputePeriodEndBlock },
    };
  }).bind(O.fromNullable);
};
