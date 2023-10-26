import { WizardStep } from "components/wizard/types";
import { MarketFormData } from "./form";
import { union } from "lib/types/union";

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
  | "Liquidity"
  | "Summary";

/**
 * Market creation step that extends the wizard stepper data by the market creation
 * specific step types.
 */
export type MarketCreationStep = WizardStep<MarketCreationStepType>;

/**
 * All steps in the market creation form.
 * @note Using union exhaustiveness helper to assert all step types are represented in the array.
 */
export const marketCreationSteps = union<MarketCreationStep>()
  .by("label")
  .exhaust([
    { label: "Currency", isValid: false, isTouched: false, reached: true },
    { label: "Question", isValid: false, isTouched: false, reached: false },
    { label: "Answers", isValid: false, isTouched: false, reached: false },
    { label: "Time Period", isValid: false, isTouched: false, reached: false },
    { label: "Oracle", isValid: false, isTouched: false, reached: false },
    { label: "Description", isValid: false, isTouched: false, reached: false },
    { label: "Moderation", isValid: false, isTouched: false, reached: false },
    { label: "Liquidity", isValid: false, isTouched: false, reached: false },
    { label: "Summary", isValid: false, isTouched: false, reached: false },
  ]);

/**
 * A record mapping a market creation step type to the related form keys.
 * @note Using union exhaustiveness helper to assert all step types are represented in the record.
 */
export const stepFormKeys: Record<
  MarketCreationStepType,
  Array<keyof MarketFormData>
> = union<MarketCreationStepType>().exhaustAsRecord({
  Currency: ["currency"],
  Question: ["question", "tags"],
  Answers: ["answers"],
  "Time Period": [
    "endDate",
    "timeZone",
    "gracePeriod",
    "reportingPeriod",
    "disputePeriod",
  ],
  Oracle: ["oracle"],
  Description: ["description"],
  Moderation: ["moderation"],
  Liquidity: ["creatorFee", "liquidity"],
  Summary: [
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
});

/**
 * Get the market step type a given form key is related to.
 * @param key - the form key to get the section for
 */
export const sectionForFormKey = (
  key: keyof MarketFormData,
): MarketCreationStepType | undefined => {
  for (const sectionKey in stepFormKeys) {
    if (stepFormKeys[sectionKey].includes(key))
      return sectionKey as MarketCreationStepType;
  }
  throw new Error(
    `[SHOULD BE UNREACHABLE] No section found for form key ${key}`,
  );
};
