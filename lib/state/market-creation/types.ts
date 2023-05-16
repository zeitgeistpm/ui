import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { WizardStepData } from "components/wizard/types";
import { SupportedTag } from "lib/constants/markets";

export type CreateMarketWizardStep =
  | "Currency"
  | "Question"
  | "Answers"
  | "Time Period"
  | "Oracle"
  | "Description"
  | "Moderation"
  | "Preview";

export type CreateMarketStep = WizardStepData<CreateMarketWizardStep>;

export const createMarketWizardSteps: CreateMarketStep[] = [
  { label: "Currency", isValid: false },
  { label: "Question", isValid: false },
  { label: "Answers", isValid: false },
  { label: "Time Period", isValid: false },
  { label: "Oracle", isValid: false },
  { label: "Description", isValid: false },
  { label: "Moderation", isValid: false },
  { label: "Preview", isValid: false },
];

export type CreateMarketFormData = CurrencySectionFormData &
  QuestionSectionFormData;

export type CurrencySectionFormData = {
  currency: SupportedCurrencyTag;
};

export type QuestionSectionFormData = {
  question: string;
  tags: SupportedTag[];
};
