import {
  CreateMarketBaseParams,
  CreateMarketParams,
  MarketMetadata,
  MetadataStorage,
  RpcContext,
  ZTG,
  swapFeeFromFloat,
} from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import Decimal from "decimal.js";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import moment from "moment";
import { DeepRequired } from "react-hook-form";
import * as z from "zod";
import { timelineAsBlocks } from "./timeline";
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
import { tickersForAnswers } from "../util/tickers";

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

/**
 * Create a the needed params for the market creation extrinsic from the form data.
 */
export const marketFormDataToExtrinsicParams = (
  form: ValidMarketFormData,
  signer: KeyringPairOrExtSigner,
  chainTime: ChainTime,
): CreateMarketParams<RpcContext<MetadataStorage>, MetadataStorage> => {
  const timeline = timelineAsBlocks(form, chainTime).unwrap();

  const base: CreateMarketBaseParams<
    RpcContext<MetadataStorage>,
    MetadataStorage
  > = {
    signer,
    disputeMechanism: "Authorized",
    oracle: form.oracle,
    period: {
      Timestamp: [Date.now(), new Date(form.endDate).getTime()],
    },
    deadlines: {
      gracePeriod: timeline.grace.period,
      oracleDuration: timeline.report.period,
      disputeDuration: timeline.dispute.period,
    },
    marketType:
      form.answers.type === "scalar"
        ? {
            Scalar: [form.answers.answers[0], form.answers.answers[1]],
          }
        : {
            Categorical: form.answers.answers.length,
          },
    metadata: {
      __meta: "markets",
      description: form.description,
      question: form.question,
      slug: form.question,
      tags: form.tags,
      categories: tickersForAnswers(form.answers),
    },
    baseAsset: form.currency === "ZTG" ? { Ztg: null } : { ForeignAsset: 0 },
  };

  if (form.moderation === "Permissionless") {
    return {
      ...base,
      creationType: form.moderation,
      pool: form.liquidity.deploy
        ? {
            amount: new Decimal(form.liquidity.rows[0].amount)
              .mul(ZTG)
              .toString(),
            swapFee: swapFeeFromFloat(form.liquidity.swapFee).toString(),
            weights: form.liquidity.rows.slice(0, -1).map((row) => {
              return new Decimal(row.weight)
                .mul(ZTG)
                .toFixed(0, Decimal.ROUND_DOWN);
            }),
          }
        : undefined,
    };
  } else {
    return {
      ...base,
      creationType: form.moderation,
    };
  }
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
