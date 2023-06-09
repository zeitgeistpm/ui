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
  /**
   * The form data of the draft.
   */
  form: Partial<MarketFormData>;
  /**
   * Whether the draft is in wizard mode or not.
   */
  isWizard: boolean;
  /**
   * The current step of the draft in wizard mode.
   */
  currentStep: MarketCreationStep;
  /**
   * The touch state of the form pr field.
   */
  touchState: Partial<Record<keyof MarketFormData, boolean>>;
  /**
   * The reach state of the steps.
   * Has a step in the editing process been reached.
   */
  stepReachState: Partial<Record<MarketCreationStepType, boolean>>;
  /**
   * Whether the market has been published or not.
   */
  isPublished: boolean;
  /**
   * The id of the market if it has been published.
   */
  marketId?: number;
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
      swapFee: 1,
    },
  },
  touchState: {},
  stepReachState: {
    Currency: true,
  },
  isPublished: false,
});
