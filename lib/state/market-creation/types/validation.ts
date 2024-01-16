import { ZeitgeistPrimitivesMarketMarketCreation } from "@polkadot/types/lookup";
import { encodeAddress } from "@polkadot/util-crypto";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import { defaultTags } from "lib/constants/markets";
import {
  MarketDeadlineConstants,
  useMarketDeadlineConstants,
} from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "lib/state/chaintime";
import { isNaN, isNumber } from "lodash-es";
import * as z from "zod";
import { SupportedCurrencyTag } from "../../../constants/supported-currencies";
import { minBaseLiquidity } from "../constants/currency";
import { MarketFormData } from "./form";
import { timelineAsBlocks } from "./timeline";

export type MarketValidationDependencies = {
  form: Partial<MarketFormData>;
  deadlineConstants: MarketDeadlineConstants;
  chainTime: ChainTime;
};

/**
 * Creates a zod schema validator for the market creation form.
 * Needs some context like the other form fields and some remote data like on
 * chain constants and chain time.
 *
 * @param form - used for context where fields need to be validated against each other.
 * @param deadlineConstants - used to validate deadlines against chain min and max constants.
 * @param chainTime - used to validate deadlines against chain time.
 */
export const createMarketFormValidator = ({
  form,
  deadlineConstants,
  chainTime,
}: MarketValidationDependencies) => {
  const timeline = timelineAsBlocks(form, chainTime).unwrap();

  return z
    .object({
      currency: IOCurrency,
      question: IOQuestion,
      tags: IOTags,
      answers: IOAnswers,
      endDate: IOEndDate,
      gracePeriod: IOPeriodOption.refine(
        () => !(timeline?.grace.period && timeline.grace.period < 0),
        {
          message: "Grace period must be after market end date",
        },
      ).refine(
        () =>
          !(
            timeline?.grace.period &&
            timeline.grace.period > deadlineConstants?.maxGracePeriod
          ),
        {
          message: `Grace period must be less than ${deadlineConstants?.maxGracePeriod} blocks.`,
        },
      ),
      reportingPeriod: IOPeriodOption.refine(
        () =>
          !(
            !timeline?.report.period ||
            timeline.report.period < deadlineConstants?.minOracleDuration
          ),
        {
          message: `Reporting period must be greater than ${deadlineConstants?.minOracleDuration} blocks.`,
        },
      ).refine(
        () =>
          timeline?.report?.period &&
          timeline?.report?.period <= deadlineConstants?.maxOracleDuration,
        {
          message: `Reporting period must be less than ${deadlineConstants?.maxOracleDuration} blocks.`,
        },
      ),
      disputePeriod: IOPeriodOption.refine(
        () =>
          !(
            !timeline?.dispute.period ||
            timeline.dispute.period < deadlineConstants?.minDisputeDuration
          ),
        {
          message: `Dispute period must be greater than ${deadlineConstants?.minDisputeDuration} blocks.`,
        },
      ).refine(
        () =>
          !(
            timeline?.dispute.period &&
            timeline.dispute.period > deadlineConstants?.maxDisputeDuration
          ),
        {
          message: `Dispute period must be less than ${deadlineConstants?.maxDisputeDuration} blocks.`,
        },
      ),
      oracle: IOOracle,
      description: IODescription,
      moderation: IOModerationMode,
      liquidity: IOLiquidity,
      creatorFee: IOCreatorFee,
    })
    .superRefine((form, ctx) => {
      const min = minBaseLiquidity[form.currency];

      let baseLiquidity: number | undefined;

      if (form?.liquidity?.amount) {
        baseLiquidity = Number(form?.liquidity?.amount);
      } else {
        baseLiquidity = Number(form.liquidity.amount);
      }

      if (isNaN(baseLiquidity) || !isNumber(baseLiquidity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["liquidity", "amount"],
          message: "Liquidity must be a number",
        });
      }

      if (form.liquidity.deploy && (!baseLiquidity || baseLiquidity < min)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["liquidity", "base"],
          message: `Minimum base liquidity is ${min} ${form.currency}`,
        });
      }
    })
    .superRefine((form, ctx) => {
      if (
        form.moderation === "Permissionless" &&
        form.liquidity?.deploy &&
        form.liquidity?.rows &&
        form.liquidity?.rows?.length < 3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["liquidity"],
          message: "Answers section must have a minimum of two valid answers.",
        });
      }
    });
};

/**
 * Hook for consuming a market creation form validator that is reactive to the form
 * and on chain constants + chain time.
 */
export const useMarketCreationFormValidator = (
  form: Partial<MarketFormData>,
): ReturnType<typeof createMarketFormValidator> | undefined => {
  const { data: deadlineConstants } = useMarketDeadlineConstants();
  const chainTime = useChainTime();

  if (!deadlineConstants || !chainTime) {
    return;
  }
  return createMarketFormValidator({
    form,
    deadlineConstants,
    chainTime,
  });
};

/**
 * -------------
 * Zod Schemas for individual form fields.
 * -------------
 */

export const IOCurrency = z.enum<SupportedCurrencyTag, ["ZTG", "DOT"]>([
  "ZTG",
  "DOT",
]);

export const IOQuestion = z
  .string()
  .min(10, { message: "Must be 10 or more characters long" })
  .max(100, { message: "Must be 100 or fewer characters long" });

export const IOTimeZone = z.string().nonempty();

export const IOTags = z
  .array(z.enum(defaultTags))
  .min(1, { message: "Must select at least one category" });

export const IOYesNoAnswers = z
  .object({
    type: z.literal("yes/no"),
    answers: z.tuple([z.literal("Yes"), z.literal("No")]),
  })
  .required();

export const IOCategoricalAnswers = z
  .object({
    type: z.literal("categorical"),
    answers: z
      .array(
        z
          .string()
          .min(1, { message: "Answers must be at least one character long." }),
      )
      .min(2, { message: "Must have at least two answers" })
      .refine((answers) => new Set(answers).size === answers.length, {
        message: "Answers must be unique.",
      }),
  })
  .required();

export const IOScalarAnswers = z.object({
  type: z.literal("scalar"),
  numberType: z.union([z.literal("number"), z.literal("date")]),
  answers: z
    .tuple([
      z.number().gte(0, {
        message: "Scalar values must be greater than or equal to 0",
      }),
      z.number().gte(0, {
        message: "Scalar values must be greater than or equal to 0",
      }),
    ])
    .refine((schema) => schema[0] < schema[1], {
      message: "Lower bound must be less than upper bound",
    }),
});

export const IOAnswers = z.union(
  [IOYesNoAnswers, IOCategoricalAnswers, IOScalarAnswers],
  {
    errorMap: () => {
      return { message: "All fields are required" };
    },
  },
);

export const IOEndDate = z
  .string()
  .datetime()
  .refine((date) => new Date(date) > new Date(), {
    message: "End date must be in the future",
  });

export const IOPeriodDateOption = z.object({
  type: z.literal("date"),
  date: z
    .string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), {
      message: "End date must be in the future",
    }),
});

export const IOPeriodDurationOption = z.object({
  type: z.literal("duration"),
  preset: z.string().optional(),
  unit: z.enum(["days", "hours"]),
  value: z.number(),
});

export const IOPeriodOption = z.union([
  IOPeriodDateOption,
  IOPeriodDurationOption,
]);

export const IOOracle = z
  .string()
  .refine((oracle) => !tryCatch(() => encodeAddress(oracle, 74)).isNone(), {
    message: "Oracle must be a valid polkadot address",
  });

export const IODescription = z.string().optional();

export const IOModerationMode = z.enum<
  ZeitgeistPrimitivesMarketMarketCreation["type"],
  ["Permissionless", "Advised"]
>(["Permissionless", "Advised"]);

export const IOCreatorFee = z.object({
  type: z.union([z.literal("custom"), z.literal("preset")]),
  value: z
    .number()
    .min(0, {
      message: "Creator fee must be a positive number.",
    })
    .max(1, { message: "Creator fee cannot exceed 1%." }),
});

export const IOLiquidityRow = z.object({
  asset: z.string(),
  // weight: z.string(),
  amount: z.string(),
  price: z.object({
    price: z.string(),
    locked: z.boolean(),
  }),
  value: z.string(),
});

export const IOSwapFee = z
  .number()
  .min(0, {
    message: "Swap fee must be a positive number.",
  })
  .max(10, { message: "Swap fee cannot exceed 10%." });

export const IOLiquidity = z.object({
  deploy: z.boolean(),
  amount: z.optional(z.string()),
  rows: z.optional(z.array(IOLiquidityRow)),
  swapFee: z.union([
    z.object({
      type: z.literal("preset"),
      value: IOSwapFee,
    }),
    z.object({
      type: z.literal("custom"),
      value: IOSwapFee,
    }),
  ]),
});
