import { MarketCreationStepType } from "./step";
import {} from "io-ts";
import { defaultTags } from "lib/constants/markets";
import * as zod from "zod";
import { SupportedCurrencyTag, supportedCurrencies } from "./currency";
import { MarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import {
  ChainTime,
  blockDate,
  dateBlock,
} from "@zeitgeistpm/utility/dist/time";

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
      return { message: "Field is required" };
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
      { message: "Grace period must be before end date" },
    ).refine(
      (gracePeriod) => {
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
    reportingPeriod: ZBlockPeriodOption.refine(
      (reportingPeriod) => {
        if (
          Boolean(
            reportingPeriod?.type === "blocks" &&
              form?.gracePeriod?.type === "blocks",
          ) ||
          Boolean(
            form?.gracePeriod?.type === "date" &&
              reportingPeriod?.type === "blocks",
          )
        ) {
          return true;
        }

        const graceEndDate =
          form?.gracePeriod?.type === "blocks"
            ? blockDate(chainTime, chainTime?.block + form?.gracePeriod.value)
            : blockDate(
                chainTime,
                dateBlock(chainTime, new Date(form?.gracePeriod.value)),
              );
        console.log({ graceEndDate });

        // const reportEndDate =
        //   reportingPeriod?.type === "blocks"
        //     ? blockDate(chainTime, chainTime?.block + reportingPeriod?.value)
        //     : blockDate(
        //         chainTime,
        //         dateBlock(chainTime, new Date(reportingPeriod?.value)),
        //       );

        if (form?.gracePeriod?.type === "blocks") {
          const delta =
            dateBlock(chainTime, new Date(form?.gracePeriod.value)) -
            chainTime.block;
        }

        //new Date(reportingPeriod?.value) > new Date(form?.gracePeriod?.value)
        return true;
      },
      { message: "Reporting must end later than the grace period." },
    ),
    disputePeriod: ZBlockPeriodOption,
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
