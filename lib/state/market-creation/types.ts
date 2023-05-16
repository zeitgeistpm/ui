import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { WizardStepData } from "components/wizard/types";
import { SupportedTag } from "lib/constants/markets";

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

export type MarketCreationForm = CurrencySectionForm &
  QuestionAndCategorySectionForm;

export type CurrencySectionForm = {
  currency: SupportedCurrencyTag;
};

export type QuestionAndCategorySectionForm = {
  question: string;
  tags: SupportedTag[];
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
