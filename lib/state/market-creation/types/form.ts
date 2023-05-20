import { ZeitgeistPrimitivesMarketMarketCreation } from "@polkadot/types/lookup";
import { encodeAddress } from "@polkadot/util-crypto";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";
import { defaultTags } from "lib/constants/markets";
import { MarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import * as z from "zod";
import { SupportedCurrencyTag } from "./currency";

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

export type CurrencyTag = z.infer<typeof ZCurrencyTag>;
export type Question = z.infer<typeof ZQuestion>;
export type Tags = z.infer<typeof ZTags>;
export type Answers = z.infer<typeof ZAnswers>;
export type YesNoAnswers = z.infer<typeof ZYesNoAnswers>;
export type CategoricalAnswers = z.infer<typeof ZCategoricalAnswers>;
export type ScalarAnswers = z.infer<typeof ZScalarAnswers>;
export type EndDate = z.infer<typeof ZEndDate>;
export type PeriodOption = z.infer<typeof ZPeriodOption>;
export type Oracle = z.infer<typeof ZOracle>;
export type Description = z.infer<typeof ZDescription>;
export type Moderation = z.infer<typeof ZModerationMode>;

export const ZCurrencyTag = z.enum<SupportedCurrencyTag, ["ZTG", "DOT"]>([
  "ZTG",
  "DOT",
]);

export const ZQuestion = z
  .string()
  .min(10, { message: "Must be 10 or more characters long" })
  .max(100, { message: "Must be 100 or fewer characters long" });

export const ZTags = z
  .array(z.enum(defaultTags))
  .min(1, { message: "Must select atleast one category" });

export const ZYesNoAnswers = z
  .object({
    type: z.literal("yes/no"),
    answers: z.tuple([z.literal("Yes"), z.literal("No")]),
  })
  .required();

export const ZCategoricalAnswers = z
  .object({
    type: z.literal("categorical"),
    answers: z
      .array(
        z
          .string()
          .min(1, { message: "Answers must be atleast one character long." }),
      )
      .min(2, { message: "Must have atleast two answers" }),
  })
  .required();

export const ZScalarAnswers = z.object({
  type: z.literal("scalar"),
  answers: z
    .tuple([z.number(), z.number()])
    .refine((schema) => schema[0] < schema[1], {
      message: "Lower bound must be less than upper bound",
    }),
});

export const ZAnswers = z.union(
  [ZYesNoAnswers, ZCategoricalAnswers, ZScalarAnswers],
  {
    errorMap: (error) => {
      return { message: "All fields are required" };
    },
  },
);

export const ZEndDate = z.string().datetime();

export const ZPeriodOption = z.union([
  z.object({
    type: z.literal("blocks"),
    label: z.string(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("date"),
    value: z.string().datetime(),
  }),
]);

export const ZOracle = z
  .string()
  .refine((oracle) => !tryCatch(() => encodeAddress(oracle, 74)).isNone(), {
    message: "Oracle must be a valid polkadot address",
  });

export const ZDescription = z.string().optional();

export const ZModerationMode = z.enum<
  ZeitgeistPrimitivesMarketMarketCreation["type"],
  ["Permissionless", "Advised"]
>(["Permissionless", "Advised"]);

export type ValidationDependencies = {
  form: Partial<MarketCreationFormData>;
  deadlineConstants?: MarketDeadlineConstants;
  chainTime?: ChainTime;
};

export const ZMarketCreationFormData = ({
  form,
  deadlineConstants,
  chainTime,
}: ValidationDependencies) => {
  return z.object({
    currency: ZCurrencyTag,
    question: ZQuestion,
    tags: ZTags,
    answers: ZAnswers,
    endDate: z
      .string()
      .datetime()
      .refine((date) => new Date(date) > new Date(), {
        message: "End date must be in the future",
      }),
    gracePeriod: ZPeriodOption.refine(
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
    reportingPeriod: ZPeriodOption.superRefine((reportingPeriod, ctx) => {
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
    disputePeriod: ZPeriodOption.superRefine((disputePeriod, ctx) => {
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
    oracle: ZOracle,
    description: ZDescription,
    moderation: ZModerationMode,
  });
};
