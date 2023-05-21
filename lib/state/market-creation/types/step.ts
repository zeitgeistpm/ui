import { WizardStep } from "components/wizard/types";
import { MarketCreationFormData } from "./form";
import { UnionToArray } from "lib/types/union";

/**
 * Type of a market creation wizard step or section.
 * @note a step represents a group of FieldStates.
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
export type MarketCreationStep = WizardStep<MarketCreationStepType>;

/**
 * Type safe list of all market creation steps inferred from all
 * possible step union types.
 */
export type MarketCreationSteps = UnionToArray<MarketCreationStep>;

/**
 * All steps in the market creation form.
 */
export const marketCreationSteps: MarketCreationSteps = [
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
  Preview: [
    "currency",
    "question",
    "tags",
    "answers",
    "endDate",
    "gracePeriod",
    "reportingPeriod",
    "disputePeriod",
    "oracle",
    "moderation",
  ],
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
