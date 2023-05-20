import { DeepReadonly } from "lib/types/deep-readonly";
import { MarketCreationFormData } from "./form";

export type FieldState = {
  isValid: boolean;
  isTouched?: boolean;
  errors?: string[];
};

export type FieldsState = DeepReadonly<
  Record<keyof MarketCreationFormData, FieldState>
>;

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
};
