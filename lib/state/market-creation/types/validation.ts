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
import { useMemo } from "react";
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
          timeline?.grace.period &&
          timeline.report.period < deadlineConstants?.maxOracleDuration,
        {
          message: `Reporting period must be less than ${deadlineConstants?.maxOracleDuration} blocks.`,
        },
      ).refine(
        () =>
          !(
            timeline?.grace.period &&
            timeline.report.period < deadlineConstants?.minOracleDuration
          ),
        {
          message: `Reporting period must be greater than ${deadlineConstants?.minOracleDuration} blocks.`,
        },
      ),
      disputePeriod: IOPeriodOption.refine(
        () =>
          !(
            timeline?.grace.period &&
            timeline.dispute.period > deadlineConstants?.maxDisputeDuration
          ),
        {
          message: `Dispute period must be less than ${deadlineConstants?.maxDisputeDuration} blocks.`,
        },
      ).refine(
        () =>
          !(
            timeline?.grace.period &&
            timeline.dispute.period < deadlineConstants?.minDisputeDuration
          ),
        {
          message: `Dispute period must be greater than ${deadlineConstants?.minDisputeDuration} blocks.`,
        },
      ),
      oracle: IOOracle,
      description: IODescription,
      moderation: IOModerationMode,
      liquidity: IOLiquidity,
    })
    .superRefine((form, ctx) => {
      const baseLiquidityRow =
        form.liquidity?.rows?.[form.liquidity?.rows.length - 1];

      if (form.moderation === "Permissionless" && form?.liquidity?.deploy) {
        const min = minBaseLiquidity[form.currency];
        const amount = parseFloat(baseLiquidityRow.amount) * 2;

        if (!amount || amount < min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["liquidity", "base"],
            message: `Minimum base liquidity is ${min} ${form.currency}`,
          });
        }
      }
    })
    .superRefine((form, ctx) => {
      if (
        form.moderation === "Permissionless" &&
        form.liquidity?.deploy &&
        form.liquidity?.rows?.length < 3
      ) {
        console.log("WAT");
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["liquidity"],
          message:
            "Answers section must have a minimum of two valid answersss.",
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
): ReturnType<typeof createMarketFormValidator> => {
  const { data: deadlineConstants } = useMarketDeadlineConstants();
  const chainTime = useChainTime();
  return useMemo(() => {
    return createMarketFormValidator({
      form,
      deadlineConstants,
      chainTime,
    });
  }, [form, deadlineConstants, chainTime]);
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

export const IOTags = z
  .array(z.enum(defaultTags))
  .min(1, { message: "Must select atleast one category" });

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
          .min(1, { message: "Answers must be atleast one character long." }),
      )
      .min(2, { message: "Must have atleast two answers" })
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
  block: z.number(),
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

export const IOLiquidityRow = z.object({
  asset: z.string(),
  weight: z.string(),
  amount: z.string(),
  price: z.object({
    price: z.string(),
    locked: z.boolean(),
  }),
  value: z.string(),
});

export const IOSwappFee = z
  .number()
  .min(0, {
    message: "Swap fee must be a postive number.",
  })
  .max(10, { message: "Swap fee cannot exceed 10%." });

export const IOLiquidity = z.object({
  deploy: z.boolean(),
  rows: z.array(IOLiquidityRow),
  swapFee: z.union([
    z.object({
      type: z.literal("preset"),
      value: IOSwappFee,
    }),
    z.object({
      type: z.literal("custom"),
      value: IOSwappFee,
    }),
  ]),
});
