import * as O from "@zeitgeistpm/utility/dist/option";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import moment from "moment";
import * as z from "zod";
import {
  IOAnswers,
  IOCategoricalAnswers,
  IOCurrency,
  IODescription,
  IOEndDate,
  IOLiquidity,
  IOLiquidityRow,
  IOModerationMode,
  IOOracle,
  IOPeriodDateOption,
  IOPeriodDurationOption,
  IOPeriodOption,
  IOQuestion,
  IOScalarAnswers,
  IOTags,
  IOYesNoAnswers,
} from "./validation";
import { DeepRequired } from "react-hook-form";

/**
 * This is the type of the full market creation form data that is used to create a market.
 * It is infered from the zod schema validation types below.
 *
 * @note - Because we are not in strict ts mode zod allways infers partial form fields.
 *  When we move to strict null checks we can do ```z.infer<ReturnType<typeof createMarketFormValidator>>```
 */
export type MarketFormData = {
  currency: CurrencyTag;
  question: Question;
  tags: Tags;
  answers: Answers;
  endDate: EndDate;
  gracePeriod: PeriodOption;
  reportingPeriod: PeriodOption;
  disputePeriod: PeriodOption;
  oracle: Oracle;
  description?: Description;
  moderation: Moderation;
  liquidity: Liquidity;
};

export type ValidMarketFormData = DeepRequired<MarketFormData>;
export type PartialMarketFormData = Partial<MarketFormData>;

/**
 * Array of all form keys in the market creation form.
 */
export const marketCreationFormKeys = [
  "currency",
  "question",
  "tags",
  "answers",
  "endDate",
  "gracePeriod",
  "reportingPeriod",
  "disputePeriod",
  "oracle",
  "description",
  "moderation",
  "liquidity",
] as const;

/**
 * These are the individual market form field types.
 * They are infered from the individual field zod schema validation types below.
 *
 * @note - Because we are not in strict ts mode zod allways infers partial form fields
 * so we have to hardocde required for each field that can only be a fullu defined object like answers and periods.
 */
export type CurrencyTag = z.infer<typeof IOCurrency>;
export type Question = z.infer<typeof IOQuestion>;
export type Tags = z.infer<typeof IOTags>;
export type Answers = Required<z.infer<typeof IOAnswers>>;
export type YesNoAnswers = Required<z.infer<typeof IOYesNoAnswers>>;
export type CategoricalAnswers = Required<z.infer<typeof IOCategoricalAnswers>>;
export type ScalarAnswers = Required<z.infer<typeof IOScalarAnswers>>;
export type EndDate = z.infer<typeof IOEndDate>;
export type PeriodOption = Required<z.infer<typeof IOPeriodOption>>;
export type PeriodDateOption = Required<z.infer<typeof IOPeriodDateOption>>;
export type PeriodDurationOption = Required<
  z.infer<typeof IOPeriodDurationOption>
>;
export type Oracle = z.infer<typeof IOOracle>;
export type Description = z.infer<typeof IODescription>;
export type Moderation = z.infer<typeof IOModerationMode>;
export type Liquidity = z.infer<typeof IOLiquidity>;
export type LiquidityRow = z.infer<typeof IOLiquidityRow>;

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

export const durationasBlocks = (duration: Partial<PeriodDurationOption>) => {
  return (
    moment.duration(duration.value, duration.unit).asSeconds() /
    BLOCK_TIME_SECONDS
  );
};

export const blocksAsDuration = (blocks: number) => {
  return moment.duration(blocks * BLOCK_TIME_SECONDS * 1000, "milliseconds");
};
