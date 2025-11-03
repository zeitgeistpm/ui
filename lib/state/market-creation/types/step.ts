import { WizardStep } from "components/wizard/types";
import { MarketFormData } from "./form";
import { union } from "lib/types/union";

/**
 * Type of a market creation wizard step or section.
 * @note a step represents a group of FieldStates.
 */
export type MarketCreationStepType =
  | "Question & Answers"
  | "Timeline & Resolution"
  | "Pricing & Options"
  | "Review & Launch";

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
    { label: "Question & Answers", isValid: false, isTouched: false, reached: true },
    {
      label: "Timeline & Resolution",
      isValid: false,
      isTouched: false,
      reached: false,
    },
    {
      label: "Pricing & Options",
      isValid: false,
      isTouched: false,
      reached: false,
    },
    {
      label: "Review & Launch",
      isValid: false,
      isTouched: false,
      reached: false,
    },
  ]);

/**
 * A record mapping a market creation step type to the related form keys.
 * @note Using union exhaustiveness helper to assert all step types are represented in the record.
 */
export const stepFormKeys: Record<
  MarketCreationStepType,
  Array<keyof MarketFormData>
> = union<MarketCreationStepType>().exhaustAsRecord({
  "Question & Answers": ["question", "answers", "tags", "description"],
  "Timeline & Resolution": [
    "endDate",
    "timeZone",
    "gracePeriod",
    "reportingPeriod",
    "disputePeriod",
    "oracle",
  ],
  "Pricing & Options": [
    "currency",
    "creatorFee",
    "moderation",
    "liquidity",
  ],
  "Review & Launch": [
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
    "creatorFee",
    "liquidity",
    "description",
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
