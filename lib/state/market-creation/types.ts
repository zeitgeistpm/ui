import { SupportedCurrencyTag } from "components/create/form/inputs/Currency";
import { WizardStepData } from "components/wizard/WizardStepper";
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

export const createMarketWizardSteps: WizardStepData<CreateMarketWizardStep>[] =
  [
    { label: "Currency" },
    { label: "Question" },
    { label: "Answers" },
    { label: "Time Period" },
    { label: "Oracle" },
    { label: "Description" },
    { label: "Moderation" },
    { label: "Preview" },
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
