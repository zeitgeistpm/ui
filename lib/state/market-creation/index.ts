import { FormEvent } from "components/create/form/types";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { persistentAtom } from "../util/persistent-atom";
import {
  gracePeriodOptions,
  reportingPeriodOptions,
} from "./constants/deadline-options";
import { FieldsState, initialFieldsState } from "./types/fieldstate";
import { MarketCreationFormData, marketCreationFormKeys } from "./types/form";
import {
  MarketCreationStep,
  MarketCreationStepType,
  MarketCreationSteps,
  marketCreationSteps,
  stepForFormKey,
  stepFormKeys,
} from "./types/step";
import { useMarketCreationFormValidator } from "./types/validation";

export type UseCreateMarketState = {
  /**
   * Is the market creation mode in wizard mode or not.
   */
  isWizard: boolean;
  /**
   * The current state of the form data.
   * Can be partial data.
   */
  form: Partial<MarketCreationFormData>;
  /**
   * The steps of the market creation process.
   * Has state regarding if the step is valid, if it has been touched(edited) by the user and if it
   * has been reached in the current editing session.
   */
  steps: MarketCreationSteps;
  /**
   * The current step the user is on.
   */
  currentStep: MarketCreationStep;
  /**
   * State pr field input.
   * Has state regarding if the input is valid, if it has been touched(edited) by the user and potential validation errors.
   */
  fieldsState: FieldsState;
  /**
   * Is the form as a whole valid.
   */
  isValid: boolean;
  /**
   * Reset the form state.
   */
  reset: () => void;
  /**
   * Set the step the user is on.
   */
  setStep: (step: MarketCreationStep) => void;
  /**
   * Toggle the wizard mode on or off.
   */
  setWizard: (on: boolean) => void;

  /**
   * Register a input to a form key.
   */
  input: <K extends keyof MarketCreationFormData>(
    key: K,
    options?: {
      type?: "text" | "number";
      mode?: "onChange" | "onBlur" | "all";
    },
  ) => {
    name: K;
    value: Partial<MarketCreationFormData>[K];
    onChange: (event: FormEvent<MarketCreationFormData[K]>) => void;
    onBlur: (event: FormEvent<MarketCreationFormData[K]>) => void;
  };
};

/**
 * The base state of a market creation session.
 *
 * @note - If we need to safe multiple drafts in a list of drafts, this is the state that represents one
 *  market creation session draft.
 */
export type MarketCreationState = {
  form: Partial<MarketCreationFormData>;
  isWizard: boolean;
  currentStep: MarketCreationStep;
  touchState: Partial<Record<keyof MarketCreationFormData, boolean>>;
  stepReachState: Partial<Record<MarketCreationStepType, boolean>>;
};

export const defaultState: MarketCreationState = {
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
    gracePeriod: gracePeriodOptions[0],
    reportingPeriod: reportingPeriodOptions[1],
    disputePeriod: reportingPeriodOptions[1],
  },
  touchState: {},
  stepReachState: {
    Currency: true,
  },
};

const createMarketStateAtom = persistentAtom<MarketCreationState>({
  key: "market-creation-form",
  defaultValue: defaultState,
  migrations: [() => defaultState, () => defaultState, () => defaultState],
});

export const useCreateMarketState = (): UseCreateMarketState => {
  const [state, setState] = useAtom(createMarketStateAtom);

  const validator = useMarketCreationFormValidator(state.form);

  const fieldsState = useMemo<FieldsState>(() => {
    const parsed = validator.safeParse(state.form);

    const fieldsState: FieldsState = marketCreationFormKeys.reduce<FieldsState>(
      (fieldsState, key) => {
        let isValid = true;
        let isTouched = state.touchState[key];
        let errors = [...(fieldsState[key].errors ?? [])];

        if (parsed.success !== true) {
          const issue = parsed.error.issues.find(
            (issue) => issue.path[0] === key,
          );
          if (issue) {
            errors = [...(fieldsState[key].errors || []), issue.message];
            isValid = false;
          }
        }

        return {
          ...fieldsState,
          [key]: {
            isValid,
            isTouched,
            errors,
          },
        };
      },
      initialFieldsState,
    );

    return fieldsState;
  }, [validator]);

  const isValid = Object.values(fieldsState).every((field) => field.isValid);

  const steps = marketCreationSteps.map((step) => {
    const keys = stepFormKeys[step.label];

    const reached = state.stepReachState[step.label] || false;
    const isValid = keys.every((key) => fieldsState[key].isValid);
    const isTouched = keys.some((key) => state.touchState[key]);

    return { ...step, isValid, isTouched, reached };
  }) as MarketCreationSteps;

  const reset = () => {
    setState({
      ...defaultState,
      form: {
        ...defaultState.form,
        question: "",
        oracle: "",
      },
    });
  };

  const setWizard = (on: boolean) => {
    let newState = { ...state, isWizard: on };
    if (on) {
      const firstInvalidStep = steps.find((step) => !step.isValid);
      newState.currentStep = firstInvalidStep || state.currentStep;
    }
    setState(newState);
  };

  const setStep = (step: MarketCreationStep) =>
    setState({
      ...state,
      currentStep: step,
      stepReachState: {
        ...state.stepReachState,
        [step.label]: true,
      },
    });

  const input = <K extends keyof MarketCreationFormData>(
    key: K,
    options?: {
      type?: "text" | "number";
      mode?: "onChange" | "onBlur" | "all";
    },
  ) => {
    let mode =
      options?.mode || fieldsState[key].isTouched ? "onChange" : "onBlur";

    if (options?.type === "text" || options?.type === "number") {
      const value = state.form?.[key];
      if (value === "") {
        mode = "onChange";
      }
    }

    return {
      name: key,
      value: state.form?.[key],
      onChange: (event: FormEvent<MarketCreationFormData[K]>) => {
        if (mode === "onBlur") return;
        let newState = {
          ...state,
          form: { ...state.form, [key]: event.target.value },
          touchState: { ...state.touchState, [key]: true },
        };
        if (!state.isWizard) {
          const section = stepForFormKey(key);
          newState.stepReachState[section] = true;
        }
        setState(newState);
      },
      onBlur: (event: FormEvent<MarketCreationFormData[K]>) => {
        if (mode === "onChange") return;
        let newState = {
          ...state,
          form: { ...state.form, [key]: event.target.value },
          touchState: { ...state.touchState, [key]: true },
        };
        if (!state.isWizard) {
          const section = stepForFormKey(key);
          newState.stepReachState[section] = true;
        }
        setState(newState);
      },
    };
  };

  return {
    form: state.form,
    currentStep: state.currentStep,
    isWizard: state.isWizard,
    steps,
    fieldsState,
    isValid,
    reset,
    setStep,
    setWizard,
    input,
  };
};
