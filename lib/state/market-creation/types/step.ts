import { WizardStepData } from "components/wizard/types";
import { DeepReadonly } from "lib/types/deep-readonly";
import { MarketCreationFormData } from "./form";

/**
 * Type of a market creation wizard step or section.
 */
export type MarketCreationStepType =
  | "Currency"
  | "Question"
  | "Answers"
  | "Time Period"
  | "Oracle"
  | "Description"
  | "Moderation"
  | "Preview";

/**
 * Market creation step that extends the wizard stepper data by the market creation
 * specific step types.
 */
export type MarketCreationStep = WizardStepData<MarketCreationStepType>;

/**
 * All steps in the market creation form.
 */
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

/**
 * A record mapping a market creation step type to the related form keys.
 */
export const stepFormKeys: Record<
  MarketCreationStepType,
  Array<keyof MarketCreationFormData>
> = {
  Currency: ["currency"],
  Question: ["question", "tags"],
  Answers: ["answers"],
  "Time Period": ["endDate", "gracePeriod", "reportingPeriod", "disputePeriod"],
  Oracle: ["oracle"],
  Description: ["description"],
  Moderation: ["moderation"],
  Preview: [],
};

/**
 * Get the market step type a given form key is related to.
 * @param key - the form key to get the section for
 */
export const stepForFormKey = (
  key: keyof MarketCreationFormData,
): MarketCreationStepType => {
  for (const sectionKey in stepFormKeys) {
    if (stepFormKeys[sectionKey].includes(key))
      return sectionKey as MarketCreationStepType;
  }
};
