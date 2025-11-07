import {
  disputePeriodOptions,
  gracePeriodOptions,
  reportingPeriodOptions,
} from "../constants/deadline-options";
import moment from "moment-timezone";
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
   * The current step of the draft.
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
  currentStep: {
    label: "Question & Answers",
    isValid: false,
    isTouched: false,
    reached: true,
  },
  form: {
    currency: undefined,
    question: "",
    tags: [],
    answers: {
      type: "yes/no",
      answers: ["Yes", "No"],
    },
    timeZone: moment.tz.guess(),
    endDate: undefined,
    oracle: "",
    gracePeriod: gracePeriodOptions[0],
    reportingPeriod: reportingPeriodOptions[1],
    disputePeriod: disputePeriodOptions[0],
    moderation: undefined,
    creatorFee: undefined,
    liquidity: {
      deploy: true,
      rows: [],
      swapFee: {
        type: "preset",
        value: 1,
      },
    },
    description: undefined,
  },
  touchState: {},
  stepReachState: {
    "Question & Answers": true,
  },
  isPublished: false,
});
