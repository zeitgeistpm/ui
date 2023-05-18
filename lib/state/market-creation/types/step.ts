import { WizardStepData } from "components/wizard/types";

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
