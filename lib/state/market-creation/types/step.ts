import { WizardStepData } from "components/wizard/types";
import { DeepReadonly } from "lib/types/deep-readonly";

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

export const marketCreationSteps: DeepReadonly<MarketCreationStep[]> = [
  { label: "Currency", isValid: false, isTouched: false, reached: true },
  { label: "Question", isValid: false, isTouched: false, reached: false },
  { label: "Answers", isValid: false, isTouched: false, reached: false },
  { label: "Time Period", isValid: false, isTouched: false, reached: false },
  { label: "Oracle", isValid: false, isTouched: false, reached: false },
  { label: "Description", isValid: false, isTouched: false, reached: false },
  { label: "Moderation", isValid: false, isTouched: false, reached: false },
  { label: "Preview", isValid: false, isTouched: false, reached: false },
];
