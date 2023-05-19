import {
  ChainTime,
  blockDate,
  dateBlock,
} from "@zeitgeistpm/utility/dist/time";
import {} from "io-ts";
import { defaultTags } from "lib/constants/markets";
import { MarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import * as zod from "zod";
import { SupportedCurrencyTag } from "./currency";
import { MarketCreationStepType } from "./step";

export type MarketCreationFormData = {
  currency: SupportedCurrencyTag;
  question: string;
  tags: Tags;
  answers: Answers;
  endDate: EndDate;
  gracePeriod: BlockPeriodOption;
  reportingPeriod: BlockPeriodOption;
  disputePeriod: BlockPeriodOption;
};

export type CurrencyTag = zod.infer<typeof ZCurrencyTag>;
export type Question = zod.infer<typeof ZQuestion>;
export type Tags = zod.infer<typeof ZTags>;
export type Answers = zod.infer<typeof ZAnswers>;
export type YesNoAnswers = zod.infer<typeof ZYesNoAnswers>;
export type CategoricalAnswers = zod.infer<typeof ZCategoricalAnswers>;
export type ScalarAnswers = zod.infer<typeof ZScalarAnswers>;
export type EndDate = zod.infer<typeof ZEndDate>;
export type BlockPeriodOption = zod.infer<typeof ZBlockPeriodOption>;

export const ZCurrencyTag = zod.enum<SupportedCurrencyTag, ["ZTG", "DOT"]>([
  "ZTG",
  "DOT",
]);

export const ZQuestion = zod
  .string()
  .min(10, { message: "Must be 10 or more characters long" })
  .max(100, { message: "Must be 100 or fewer characters long" });

export const ZTags = zod
  .array(zod.enum(defaultTags))
  .min(1, { message: "Must select atleast one category" });

export const ZYesNoAnswers = zod
  .object({
    type: zod.literal("yes/no"),
    answers: zod.tuple([zod.literal("Yes"), zod.literal("No")]),
  })
  .required();

export const ZCategoricalAnswers = zod
  .object({
    type: zod.literal("categorical"),
    answers: zod
      .array(
        zod
          .string()
          .min(1, { message: "Answers must be atleast one character long." }),
      )
      .min(2, { message: "Must have atleast two answers" }),
  })
  .required();

export const ZScalarAnswers = zod.object({
  type: zod.literal("scalar"),
  answers: zod
    .tuple([zod.number(), zod.number()])
    .refine((schema) => schema[0] < schema[1], {
      message: "Lower bound must be less than upper bound",
    }),
});

export const ZAnswers = zod.union(
  [ZYesNoAnswers, ZCategoricalAnswers, ZScalarAnswers],
  {
    errorMap: (error) => {
      console.log(error);
      return { message: "All fields are required" };
    },
  },
);

export const ZEndDate = zod.string().datetime();

export const ZBlockPeriodOption = zod.union([
  zod.object({
    type: zod.literal("blocks"),
    label: zod.string(),
    value: zod.number(),
  }),
  zod.object({
    type: zod.literal("date"),
    value: zod.string().datetime(),
  }),
]);

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
  return zod.object({
    currency: ZCurrencyTag,
    question: ZQuestion,
    tags: ZTags,
    answers: ZAnswers,
    endDate: zod
      .string()
      .datetime()
      .refine((date) => new Date(date) > new Date(), {
        message: "End date must be in the future",
      }),
    gracePeriod: ZBlockPeriodOption.refine(
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
    reportingPeriod: ZBlockPeriodOption.superRefine((reportingPeriod, ctx) => {
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
          code: zod.ZodIssueCode.custom,
          message: "Reporting period must end after grace period.",
        });
      } else if (delta > deadlineConstants?.maxOracleDuration) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `Reporting period exceeds maximum of ${deadlineConstants?.maxOracleDuration} blocks.`,
        });
      } else if (delta < deadlineConstants?.minOracleDuration) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `Reporting period is less than minimum of ${deadlineConstants?.minOracleDuration} blocks.`,
        });
      }

      return true;
    }),
    disputePeriod: ZBlockPeriodOption.superRefine((disputePeriod, ctx) => {
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
          code: zod.ZodIssueCode.custom,
          message: "Dispute period must end after the report period.",
        });
      } else if (delta > deadlineConstants?.maxOracleDuration) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `Dispute period exceeds maximum of ${deadlineConstants?.maxDisputeDuration} blocks.`,
        });
      } else if (delta < deadlineConstants?.minOracleDuration) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `Dispute period is less than minimum of ${deadlineConstants?.minDisputeDuration} blocks.`,
        });
      }

      return true;
    }),
  });
};

export const getSectionFormKeys = (
  section: MarketCreationStepType,
): Array<keyof MarketCreationFormData> => {
  switch (section) {
    case "Currency":
      return ["currency"];
    case "Question":
      return ["question", "tags"];
    case "Answers":
      return ["answers"];
    case "Time Period":
      return ["endDate", "gracePeriod", "reportingPeriod", "disputePeriod"];
    default:
      return [];
  }
};
