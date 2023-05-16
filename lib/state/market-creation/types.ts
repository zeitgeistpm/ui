import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { SupportedTag } from "lib/constants/markets";
import { WizardStepData } from "components/wizard/WizardStepper";

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

export const nextStepFrom = (
  steps: CreateMarketStep[],
  step: CreateMarketStep,
): CreateMarketStep => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps[index];
};

export const prevStepFrom = (
  steps: CreateMarketStep[],
  step: CreateMarketStep,
): CreateMarketStep => {
  const index = steps.findIndex((s) => s.label === step.label) - 1;
  return steps[index];
};

export type CreateMarketFormData = CurrencySectionFormData &
  QuestionSectionFormData;

export type CurrencySectionFormData = {
  currency: SupportedCurrencyTag;
};

export type QuestionSectionFormData = {
  question: string;
  tags: SupportedTag[];
};
