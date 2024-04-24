import { KeyringPairOrExtSigner } from "@zeitgeistpm/rpc";
import {
  CreateMarketParams,
  MetadataStorage,
  NoPool,
  RpcContext,
  WithPool,
  ZTG,
  swapFeeFromFloat,
} from "@zeitgeistpm/sdk";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import { Fee } from "components/create/editor/inputs/FeeSelect";
import Decimal from "decimal.js";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { union } from "lib/types/union";
import moment from "moment";
import { DeepRequired } from "react-hook-form";
import * as z from "zod";
import { tickersForAnswers } from "../util/tickers";
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
  IOSwapFee,
  IOTags,
  IOTimeZone,
  IOYesNoAnswers,
} from "./validation";

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
  timeZone: TimeZone;
  endDate: EndDate;
  gracePeriod: PeriodOption;
  reportingPeriod: PeriodOption;
  disputePeriod: PeriodOption;
  oracle: Oracle;
  creatorFee: Fee;
  description?: Description;
  moderation: Moderation;
  liquidity: Liquidity;
};

export type ValidMarketFormData = DeepRequired<MarketFormData>;
export type PartialMarketFormData = Partial<MarketFormData>;

/**
 * Array of all form keys in the market creation form.
 */
export const marketCreationFormKeys = union<keyof MarketFormData>().exhaust([
  "currency",
  "question",
  "tags",
  "answers",
  "timeZone",
  "endDate",
  "gracePeriod",
  "reportingPeriod",
  "disputePeriod",
  "oracle",
  "description",
  "moderation",
  "creatorFee",
  "liquidity",
]);

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
export type TimeZone = Required<z.infer<typeof IOTimeZone>>;
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
export type SwapFee = z.infer<typeof IOSwapFee>;
export type Liquidity = z.infer<typeof IOLiquidity>;
export type LiquidityRow = z.infer<typeof IOLiquidityRow>;

/**
 * Create a the needed params for the market creation extrinsic from the form data.
 */
export const marketFormDataToExtrinsicParams = (
  form: ValidMarketFormData,
  signer: KeyringPairOrExtSigner,
  chainTime: ChainTime,
  proxy?: KeyringPairOrExtSigner,
): CreateMarketParams<RpcContext<MetadataStorage>, MetadataStorage> => {
  const baseCurrencyMetadata = getMetadataForCurrency(form.currency);
  const timeline = timelineAsBlocks(form, chainTime).unwrap();

  if (!baseCurrencyMetadata || !timeline) {
    throw new Error("Invalid market creation form data");
  }

  const hasPool = form.moderation === "Permissionless" && form.liquidity.deploy;

  const poolParams: WithPool | NoPool = hasPool
    ? {
        scoringRule: "Lmsr",
        pool: {
          amount: new Decimal(form.liquidity.amount).mul(ZTG).toFixed(0),
          swapFee: swapFeeFromFloat(form.liquidity.swapFee?.value).toString(),
          spotPrices: form.liquidity.rows.map((row) =>
            new Decimal(row.price.price).mul(ZTG).toFixed(0),
          ),
        },
      }
    : {
        scoringRule: "AmmCdaHybrid",
        creationType: form.moderation,
      };

  let disputeMechanism: CreateMarketParams<RpcContext>["disputeMechanism"] =
    "Authorized";

  if (
    process.env.NEXT_PUBLIC_SHOW_COURT === "true" &&
    (form.answers.type === "categorical" || form.answers.type === "yes/no")
  ) {
    disputeMechanism = "Court";
  }

  const params: CreateMarketParams<RpcContext> = {
    signer,
    proxy,
    disputeMechanism,
    oracle: form.oracle,
    period: {
      Timestamp: [Date.now(), new Date(form.endDate).getTime()],
    },
    deadlines: {
      gracePeriod: timeline.grace.period,
      oracleDuration: timeline.report.period,
      disputeDuration: timeline.dispute.period,
    },
    creatorFee: new Decimal(10).pow(7).mul(form.creatorFee.value).toString(),
    marketType:
      form.answers.type === "scalar"
        ? {
            Scalar: [
              new Decimal(form.answers.answers[0]).mul(ZTG).toFixed(),
              new Decimal(form.answers.answers[1]).mul(ZTG).toFixed(),
            ],
          }
        : {
            Categorical: form.answers.answers.length,
          },
    metadata: {
      __meta: "markets",
      description: form.description ?? "",
      question: form.question,
      slug: form.question,
      tags: form.tags,
      categories: tickersForAnswers(form.answers),
      scalarType:
        form.answers?.type === "scalar" ? form.answers.numberType : undefined,
    },
    baseAsset: baseCurrencyMetadata.assetId,
    ...poolParams,
  };

  return params;
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
