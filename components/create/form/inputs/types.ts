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

export const nextStepFrom = (
  step: WizardStepData<CreateMarketWizardStep>,
): WizardStepData<CreateMarketWizardStep> => {
  const index =
    createMarketWizardSteps.findIndex((s) => s.label === step.label) + 1;
  return createMarketWizardSteps[index];
};

export const prevStepFrom = (
  step: WizardStepData<CreateMarketWizardStep>,
): WizardStepData<CreateMarketWizardStep> => {
  const index =
    createMarketWizardSteps.findIndex((s) => s.label === step.label) - 1;
  return createMarketWizardSteps[index];
};
