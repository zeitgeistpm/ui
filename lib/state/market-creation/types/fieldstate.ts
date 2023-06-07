import { ZodIssue } from "zod";
import { MarketFormData } from "./form";

/**
 * State of a field input.
 */
export type FieldState = {
  /**
   * Did the input value pass the validation.
   */
  isValid: boolean;
  /**
   * Has the input been touched by the user.
   */
  isTouched?: boolean;
  /**
   * Validation errors for the input.
   */
  errors?: ZodIssue[];
};

/**
 * A record of field states for all inputs in the market creation form.
 */
export type FieldsState = Record<keyof MarketFormData, FieldState>;

/**
 * Create Initial state of the market creation form fields state.
 */
export const empty = (): FieldsState => ({
  currency: {
    isValid: false,
    isTouched: false,
  },
  question: {
    isValid: false,
    isTouched: false,
  },
  tags: {
    isValid: false,
    isTouched: false,
  },
  answers: {
    isValid: false,
    isTouched: false,
  },
  endDate: {
    isValid: false,
    isTouched: false,
  },
  gracePeriod: {
    isValid: false,
    isTouched: false,
  },
  disputePeriod: {
    isValid: false,
    isTouched: false,
  },
  reportingPeriod: {
    isValid: false,
    isTouched: false,
  },
  oracle: {
    isValid: false,
    isTouched: false,
  },
  description: {
    isValid: false,
    isTouched: false,
  },
  moderation: {
    isValid: false,
    isTouched: false,
  },
  liquidity: {
    isValid: false,
    isTouched: false,
  },
});
