import {
  gracePeriodOptions,
  reportingPeriodOptions,
} from "../constants/deadline-options";
import { MarketFormData } from "./form";
import { MarketCreationStep, MarketCreationStepType } from "./step";

/**
 * The base state of a market creation draft session.
 *
 * @note - If we need to safe multiple drafts in a list of drafts, this is the state that represents one
 *  market creation session draft.
 */
export type MarketDraftState = {
  form: Partial<MarketFormData>;
  isWizard: boolean;
  currentStep: MarketCreationStep;
  touchState: Partial<Record<keyof MarketFormData, boolean>>;
  stepReachState: Partial<Record<MarketCreationStepType, boolean>>;
};

/**
 * Create a new empty draft state.
 */
export const empty = (): MarketDraftState => ({
  isWizard: true,
  currentStep: {
    label: "Currency",
    isValid: false,
    isTouched: false,
    reached: true,
  },
  form: {
    answers: {
      type: "categorical",
      answers: ["", ""],
    },
    oracle: "",
    gracePeriod: gracePeriodOptions[0],
    reportingPeriod: reportingPeriodOptions[1],
    disputePeriod: reportingPeriodOptions[1],
    liquidity: {
      deploy: true,
      rows: [],
      swapFee: 0.1,
    },
  },
  touchState: {},
  stepReachState: {
    Currency: true,
  },
});
