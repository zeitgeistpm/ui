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
 * Initial state of the market creation form fields state.
 */
export const initialFieldsState: FieldsState = {
  currency: {
    isValid: false,
    isTouched: false,
  },
  question: {
    isValid: true,
    isTouched: false,
  },
  tags: {
    isValid: true,
    isTouched: false,
  },
  answers: {
    isValid: true,
    isTouched: false,
  },
  endDate: {
    isValid: true,
    isTouched: false,
  },
  gracePeriod: {
    isValid: true,
    isTouched: false,
  },
  disputePeriod: {
    isValid: true,
    isTouched: false,
  },
  reportingPeriod: {
    isValid: true,
    isTouched: false,
  },
  oracle: {
    isValid: true,
    isTouched: false,
  },
  description: {
    isValid: true,
    isTouched: false,
  },
  moderation: {
    isValid: true,
    isTouched: false,
  },
  liquidity: {
    isValid: true,
    isTouched: false,
  },
};
