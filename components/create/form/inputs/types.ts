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
