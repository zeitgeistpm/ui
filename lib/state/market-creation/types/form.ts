import * as z from "zod";
import {
  IOAnswers,
  IOCategoricalAnswers,
  IOCurrency,
  IODescription,
  IOEndDate,
  IOModerationMode,
  IOOracle,
  IOPeriodCustomDateOption,
  IOPeriodCustomDurationOption,
  IOPeriodOption,
  IOPeriodPresetOption,
  IOQuestion,
  IOScalarAnswers,
  IOTags,
  IOYesNoAnswers,
} from "./validation";

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
export type PeriodPresetOption = Required<z.infer<typeof IOPeriodPresetOption>>;
export type PeriodCustomDateOption = Required<
  z.infer<typeof IOPeriodCustomDateOption>
>;
export type PeriodCustomDurationOption = Required<
  z.infer<typeof IOPeriodCustomDurationOption>
>;
export type Oracle = z.infer<typeof IOOracle>;
export type Description = z.infer<typeof IODescription>;
export type Moderation = z.infer<typeof IOModerationMode>;
