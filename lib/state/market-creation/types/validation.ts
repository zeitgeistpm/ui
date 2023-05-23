import { ZeitgeistPrimitivesMarketMarketCreation } from "@polkadot/types/lookup";
import { encodeAddress } from "@polkadot/util-crypto";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import {
  ChainTime,
  blockDate,
  dateBlock,
} from "@zeitgeistpm/utility/dist/time";
import { defaultTags } from "lib/constants/markets";
import {
  MarketDeadlineConstants,
  useMarketDeadlineConstants,
} from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "lib/state/chaintime";
import { useMemo } from "react";
import * as z from "zod";
import { SupportedCurrencyTag } from "../../../constants/supported-currencies";
import { MarketCreationFormData } from "./form";

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
}: ValidationDependencies) => {
  return z.object({
    currency: IOCurrency,
    question: IOQuestion,
    tags: IOTags,
    answers: IOAnswers,
    endDate: IOEndDate,
    gracePeriod: IOPeriodOption.superRefine((gracePeriod, ctx) => {
      if (!chainTime || !deadlineConstants) return true;

      const marketEndDate = new Date(form?.endDate);
      const marketEndBlock = dateBlock(chainTime, marketEndDate);
      const gracePeriodEndBlock =
        gracePeriod?.type === "custom-date"
          ? gracePeriod?.block
          : marketEndBlock + gracePeriod?.blocks;
      const gracePeriodEndDate = blockDate(chainTime, gracePeriodEndBlock);
      const delta = gracePeriodEndBlock - marketEndBlock;
      if (delta !== 0 && gracePeriodEndDate < marketEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Grace period must end after market ends.",
        });
      }

      if (delta > deadlineConstants?.maxGracePeriod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Grace period exceeds maximum of ${deadlineConstants?.maxGracePeriod} blocks.`,
        });
      }
    }),
    reportingPeriod: IOPeriodOption.superRefine((reportingPeriod, ctx) => {
      if (!chainTime || !deadlineConstants) return true;

      const marketEndDate = new Date(form?.endDate);
      const marketEndBlock = dateBlock(chainTime, marketEndDate);

      const gracePeriodEndBlock =
        form?.gracePeriod?.type === "custom-date"
          ? form?.gracePeriod?.block
          : marketEndBlock + form?.gracePeriod?.blocks;

      const reportingPeriodEndBlock =
        reportingPeriod?.type === "custom-date"
          ? reportingPeriod?.block
          : gracePeriodEndBlock + reportingPeriod?.blocks;

      const delta = reportingPeriodEndBlock - gracePeriodEndBlock;

      if (delta > deadlineConstants?.maxOracleDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Reporting period exceeds maximum of ${deadlineConstants?.maxOracleDuration} blocks.`,
        });
      }

      if (delta < deadlineConstants?.minOracleDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Reporting period is less than minimum of ${deadlineConstants?.minOracleDuration} blocks.`,
        });
      }

      return true;
    }),
    disputePeriod: IOPeriodOption.superRefine((disputePeriod, ctx) => {
      if (!chainTime || !deadlineConstants) return true;

      const marketEndDate = new Date(form?.endDate);
      const marketEndBlock = dateBlock(chainTime, marketEndDate);

      const gracePeriodEndBlock =
        form?.gracePeriod?.type === "custom-date"
          ? form?.gracePeriod?.block
          : marketEndBlock + form?.gracePeriod?.blocks;

      const reportingPeriodEndBlock =
        form.reportingPeriod?.type === "custom-date"
          ? form.reportingPeriod?.block
          : gracePeriodEndBlock + form.reportingPeriod?.blocks;

      const disputePeriodEndBlock =
        disputePeriod?.type === "custom-date"
          ? disputePeriod?.block
          : reportingPeriodEndBlock + disputePeriod?.blocks;

      const delta = disputePeriodEndBlock - reportingPeriodEndBlock;

      if (delta > deadlineConstants?.maxDisputeDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Dispute period exceeds maximum of ${deadlineConstants?.maxDisputeDuration} blocks.`,
        });
      }

      if (delta < deadlineConstants?.minDisputeDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Dispute period is less than minimum of ${deadlineConstants?.minDisputeDuration} blocks.`,
        });
      }

      return true;
    }),
    oracle: IOOracle,
    description: IODescription,
    moderation: IOModerationMode,
  });
};

/**
 * Hook for consuming a market creation form validator that is reactive to the form
 * and on chain constants + chain time.
 */
export const useMarketCreationFormValidator = (
  form: Partial<MarketCreationFormData>,
): ReturnType<typeof createMarketFormValidator> => {
  const { data: deadlineConstants } = useMarketDeadlineConstants();
  const chainTime = useChainTime();
  return useMemo(
    () =>
      createMarketFormValidator({
        form,
        deadlineConstants,
        chainTime,
      }),
    [form, deadlineConstants, chainTime],
  );
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
  numberType: z.union([z.literal("number"), z.literal("timestamp")]),
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

export const IOPeriodPresetOption = z.object({
  type: z.literal("preset"),
  label: z.string(),
  blocks: z.number(),
});

export const IOPeriodCustomDateOption = z.object({
  type: z.literal("custom-date"),
  block: z.number(),
});

export const IOPeriodCustomDurationOption = z.object({
  type: z.literal("custom-duration"),
  blocks: z.number(),
});

export const IOPeriodOption = z.union([
  IOPeriodPresetOption,
  IOPeriodCustomDateOption,
  IOPeriodCustomDurationOption,
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

export type ValidationDependencies = {
  form: Partial<MarketCreationFormData>;
  deadlineConstants?: MarketDeadlineConstants;
  chainTime?: ChainTime;
};
