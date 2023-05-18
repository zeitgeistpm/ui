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
  { label: "Currency", isValid: false, isTouched: false },
  { label: "Question", isValid: false, isTouched: false },
  { label: "Answers", isValid: false, isTouched: false },
  { label: "Time Period", isValid: false, isTouched: false },
  { label: "Oracle", isValid: false, isTouched: false },
  { label: "Description", isValid: false, isTouched: false },
  { label: "Moderation", isValid: false, isTouched: false },
  { label: "Preview", isValid: false, isTouched: false },
];
