import { ZeitgeistPrimitivesMarketMarketCreation } from "@polkadot/types/lookup";
import { encodeAddress } from "@polkadot/util-crypto";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";
import { defaultTags } from "lib/constants/markets";
import {
  MarketDeadlineConstants,
  useMarketDeadlineConstants,
} from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "lib/state/chaintime";
import { useMemo } from "react";
import * as z from "zod";
import { SupportedCurrencyTag } from "../../../constants/supported-currencies";

/**
 * This is the type of the full market creation form data that is used to create a market.
 * It is infered from the zod schema validation types below.
 */
export type MarketCreationFormData = {
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
};

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
] as const;

/**
 * These are the individual market form field types.
 * They are infered from the individual field zod schema validation types below.
 */
export type CurrencyTag = z.infer<typeof IOCurrency>;
export type Question = z.infer<typeof IOQuestion>;
export type Tags = z.infer<typeof IOTags>;
export type Answers = z.infer<typeof IOAnswers>;
export type YesNoAnswers = z.infer<typeof IOYesNoAnswers>;
export type CategoricalAnswers = z.infer<typeof IOCategoricalAnswers>;
export type ScalarAnswers = z.infer<typeof IOScalarAnswers>;
export type EndDate = z.infer<typeof IOEndDate>;
export type PeriodOption = z.infer<typeof IOPeriodOption>;
export type Oracle = z.infer<typeof IOOracle>;
export type Description = z.infer<typeof IODescription>;
export type Moderation = z.infer<typeof IOModerationMode>;

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
  answers: z
    .tuple([z.number(), z.number()])
    .refine((schema) => schema[0] < schema[1], {
      message: "Lower bound must be less than upper bound",
    }),
});

export const IOAnswers = z.union(
  [IOYesNoAnswers, IOCategoricalAnswers, IOScalarAnswers],
  {
    errorMap: (error) => {
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

export const IOBlockPeriod = z.object({
  type: z.literal("blocks"),
  label: z.string(),
  value: z.number(),
});

export const IODatePeriod = z.object({
  type: z.literal("date"),
  value: z.string().datetime(),
});

export const IOPeriodOption = z.union([IOBlockPeriod, IODatePeriod]);

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
    gracePeriod: IOPeriodOption.refine(
      (gracePeriod) =>
        gracePeriod.type !== "date" ||
        new Date(gracePeriod?.value) > new Date(form?.endDate),
      { message: "Grace period must end after market ends." },
    ).refine(
      (gracePeriod) => {
        if (!chainTime || !deadlineConstants) {
          return true;
        }

        const delta =
          dateBlock(chainTime, new Date(gracePeriod.value)) - chainTime.block;

        if (delta > deadlineConstants?.maxGracePeriod) {
          return false;
        }
        return true;
      },
      {
        message: `Grace period exceeds maximum of ${deadlineConstants?.maxGracePeriod} blocks.`,
      },
    ),
    reportingPeriod: IOPeriodOption.superRefine((reportingPeriod, ctx) => {
      if (!chainTime || !deadlineConstants) {
        return true;
      }

      const gracePeriodEnd =
        form?.gracePeriod?.type === "date"
          ? dateBlock(chainTime, new Date(form?.gracePeriod?.value))
          : dateBlock(chainTime, new Date(form?.endDate)) +
            form?.gracePeriod?.value;

      const reportingPeriodEnd =
        reportingPeriod?.type === "date"
          ? dateBlock(chainTime, new Date(reportingPeriod?.value))
          : gracePeriodEnd + reportingPeriod?.value;

      const delta = reportingPeriodEnd - gracePeriodEnd;

      if (reportingPeriodEnd <= gracePeriodEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reporting period must end after grace period.",
        });
      } else if (delta > deadlineConstants?.maxOracleDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Reporting period exceeds maximum of ${deadlineConstants?.maxOracleDuration} blocks.`,
        });
      } else if (delta < deadlineConstants?.minOracleDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Reporting period is less than minimum of ${deadlineConstants?.minOracleDuration} blocks.`,
        });
      }

      return true;
    }),
    disputePeriod: IOPeriodOption.superRefine((disputePeriod, ctx) => {
      if (!chainTime || !deadlineConstants) {
        return true;
      }

      const gracePeriodEnd =
        form?.gracePeriod?.type === "date"
          ? dateBlock(chainTime, new Date(form?.gracePeriod?.value))
          : dateBlock(chainTime, new Date(form?.endDate)) +
            form?.gracePeriod?.value;

      const reportingPeriodEnd =
        form?.reportingPeriod?.type === "date"
          ? dateBlock(chainTime, new Date(form?.reportingPeriod?.value))
          : gracePeriodEnd + form?.reportingPeriod?.value;

      const disputePeriodEnd =
        disputePeriod?.type === "date"
          ? dateBlock(chainTime, new Date(disputePeriod?.value))
          : reportingPeriodEnd + disputePeriod?.value;

      const delta = disputePeriodEnd - reportingPeriodEnd;

      if (disputePeriodEnd <= reportingPeriodEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dispute period must end after the report period.",
        });
      } else if (delta > deadlineConstants?.maxOracleDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Dispute period exceeds maximum of ${deadlineConstants?.maxDisputeDuration} blocks.`,
        });
      } else if (delta < deadlineConstants?.minOracleDuration) {
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
