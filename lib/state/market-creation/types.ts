import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { WizardStepData } from "components/wizard/types";
import { SupportedTag } from "lib/constants/markets";
import {} from "io-ts";

export type CreateMarketState = {
  currentStep: MarketCreationStep;
  isWizard: boolean;
  form: Partial<MarketCreationFormData>;
  touchState: Partial<Record<keyof MarketCreationFormData, boolean>>;
};

export type FieldState = {
  isValid: boolean;
  isTouched?: boolean;
  errors?: string[];
};

export type FieldsState = Record<keyof MarketCreationFormData, FieldState>;

export type MarketCreationStepType =
  | "Currency"
  | "Question"
  | "Answers"
  | "Time Period"
  | "Oracle"
  | "Description"
  | "Moderation"
  | "Preview";

export type MarketCreationStep = WizardStepData<MarketCreationStepType>;

export type MarketCreationFormData = CurrencySectionFormData &
  QuestionAndCategorySectionFormData &
  AnswersSectionFormData;

export type CurrencySectionFormData = {
  currency: SupportedCurrencyTag;
};

export type QuestionAndCategorySectionFormData = {
  question: string;
  tags: SupportedTag[];
};

export type AnswersSectionFormData = {
  answers:
    | {
        type: "categorical";
        answers: string[];
      }
    | {
        type: "scalar";
        bounds: [number, number];
      };
};

export const validate = (
  key: keyof MarketCreationFormData,
  form: Partial<MarketCreationFormData>,
): FieldState => {
  switch (key) {
    case "currency":
      return { isValid: !!form.currency };
    case "question":
      return {
        isValid: !!form.question,
        errors:
          !form.question || form.question.length < 10
            ? ["Question must be at least 10 characters"]
            : undefined,
      };
    case "tags":
      return {
        isValid: !!form.tags?.length,
        errors: form.tags?.length
          ? undefined
          : ["Please select at least one category"],
      };
    case "answers":
      return { isValid: !!form.answers };
    default:
      return { isValid: false };
  }
};

export const marketCreationSteps: MarketCreationStep[] = [
  { label: "Currency", isValid: false },
  { label: "Question", isValid: false },
  { label: "Answers", isValid: false },
  { label: "Time Period", isValid: false },
  { label: "Oracle", isValid: false },
  { label: "Description", isValid: false },
  { label: "Moderation", isValid: false },
  { label: "Preview", isValid: false },
];

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
    default:
      return [];
  }
};
