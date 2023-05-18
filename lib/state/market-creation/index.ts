import { FormEvent } from "components/create/form/types";
import { useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";
import { MarketCreationStep, marketCreationSteps } from "./types/step";
import {
  MarketCreationFormData,
  ZMarketCreationFormData,
  getSectionFormKeys,
} from "./types/form";
import { useMemo } from "react";

export type CreateMarketState = {
  currentStep: MarketCreationStep;
  isWizard: boolean;
  form: Partial<MarketCreationFormData>;
  touchState: Partial<Record<keyof MarketCreationFormData, boolean>>;
};

export type FieldState = {
  isValid: boolean;
  isTouched?: boolean;
  errors?: string[];
};

export type FieldsState = Record<keyof MarketCreationFormData, FieldState>;

export const defaultState: CreateMarketState = {
  isWizard: true,
  currentStep: { label: "Currency", isValid: false, isTouched: false },
  form: {
    answers: {
      type: "yes/no",
      answers: ["Yes", "No"],
    },
  },
  touchState: {},
};

const createMarketStateAtom = persistentAtom<CreateMarketState>({
  key: "market-creation-form",
  defaultValue: defaultState,
  migrations: [() => defaultState],
});

export const useCreateMarketState = () => {
  const [state, setState] = useAtom(createMarketStateAtom);

  const fieldsState = useMemo<FieldsState>(() => {
    const parsed = ZMarketCreationFormData.safeParse(state.form);

    let fieldsState: FieldsState = {
      currency: {
        isValid: true,
        isTouched: state.touchState.currency,
      },
      question: {
        isValid: true,
        isTouched: state.touchState.question,
      },
      tags: {
        isValid: true,
        isTouched: state.touchState.tags,
      },
      answers: {
        isValid: true,
        isTouched: state.touchState.answers,
      },
    };

    if (parsed.success !== true) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof MarketCreationFormData;
        const fieldState = fieldsState[key];
        if (!fieldState) return;
        fieldState.isValid = false;
        fieldState.errors = [...(fieldState.errors || []), issue.message];
      });
    }

    return fieldsState;
  }, [state]);

  const isValid = Object.values(fieldsState).every((field) => field.isValid);

  const steps = marketCreationSteps.map((step) => {
    const keys = getSectionFormKeys(step.label);
    const isValid =
      (keys.length && keys.every((key) => fieldsState[key].isValid)) || false;
    const isTouched =
      (keys.length && keys.some((key) => state.touchState[key])) || false;
    return { ...step, isValid, isTouched };
  });

  const reset = () => setState(defaultState);

  const setWizard = (on: boolean) => {
    let newState = { ...state, isWizard: on };
    if (on) {
      const firstInvalidStep = steps.find((step) => !step.isValid);
      newState.currentStep = firstInvalidStep || state.currentStep;
    }
    setState(newState);
  };

  const setStep = (step: MarketCreationStep) =>
    setState({ ...state, currentStep: step });

  const register = <K extends keyof MarketCreationFormData>(
    key: K,
    options?: {
      mode: "onChange" | "onBlur" | "all";
    },
  ) => {
    const mode =
      options?.mode || fieldsState[key].isTouched ? "onChange" : "onBlur";

    return {
      name: key,
      value: state.form?.[key],
      onChange: (event: FormEvent<MarketCreationFormData[K]>) => {
        if (mode === "onBlur") return;
        const { value } = event.target;
        const newState = {
          ...state,
          form: { ...state.form, [key]: value },
          touchState: { ...state.touchState, [key]: true },
        };
        setState(newState);
      },
      onBlur: (event: FormEvent<MarketCreationFormData[K]>) => {
        if (mode === "onChange") return;
        const { value } = event.target;
        const newState = {
          ...state,
          form: { ...state.form, [key]: value },
          touchState: { ...state.touchState, [key]: true },
        };
        setState(newState);
      },
    };
  };

  return {
    ...state,
    reset,
    steps,
    setStep,
    setWizard,
    register,
    fieldsState,
    isValid,
  };
};
