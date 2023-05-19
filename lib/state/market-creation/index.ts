import { FormEvent } from "components/create/form/types";
import { atom, useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";
import {
  MarketCreationStep,
  MarketCreationStepType,
  marketCreationSteps,
} from "./types/step";
import {
  MarketCreationFormData,
  ZMarketCreationFormData,
  getSectionFormKeys,
} from "./types/form";
import { useMemo } from "react";
import { useMarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "../chaintime";

export type CreateMarketState = {
  currentStep: MarketCreationStep;
  isWizard: boolean;
  form: Partial<MarketCreationFormData>;
  touchState: Partial<Record<keyof MarketCreationFormData, boolean>>;
  stepReachState: Partial<Record<MarketCreationStepType, boolean>>;
};

export type FieldState = {
  isValid: boolean;
  isTouched?: boolean;
  errors?: string[];
};

export type FieldsState = Record<keyof MarketCreationFormData, FieldState>;

export const defaultState: CreateMarketState = {
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
  },
  touchState: {},
  stepReachState: {
    Currency: true,
  },
};

const createMarketStateAtom = persistentAtom<CreateMarketState>({
  key: "market-creation-form",
  defaultValue: defaultState,
  migrations: [() => defaultState, () => defaultState, () => defaultState],
});

export const useCreateMarketState = () => {
  const [state, setState] = useAtom(createMarketStateAtom);
  const { data: deadlineConstants } = useMarketDeadlineConstants();
  const chainTime = useChainTime();

  const fieldsState = useMemo<FieldsState>(() => {
    const validator = ZMarketCreationFormData({
      form: state.form,
      deadlineConstants,
      chainTime,
    });

    const parsed = validator.safeParse(state.form);

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
      endDate: {
        isValid: true,
        isTouched: state.touchState.endDate,
      },
      gracePeriod: {
        isValid: true,
        isTouched: state.touchState.gracePeriod,
      },
      disputePeriod: {
        isValid: true,
        isTouched: state.touchState.disputePeriod,
      },
      reportingPeriod: {
        isValid: true,
        isTouched: state.touchState.reportingPeriod,
      },
      oracle: {
        isValid: true,
        isTouched: state.touchState.oracle,
      },
      description: {
        isValid: true,
        isTouched: state.touchState.description,
      },
      moderation: {
        isValid: true,
        isTouched: state.touchState.moderation,
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
  }, [state, chainTime, deadlineConstants]);

  const isValid = Object.values(fieldsState).every((field) => field.isValid);

  const steps = marketCreationSteps.map((step) => {
    const keys = getSectionFormKeys(step.label);
    const isValid =
      (keys.length && keys.every((key) => fieldsState[key].isValid)) || false;
    const isTouched =
      (keys.length &&
        Boolean(keys.find((key) => Boolean(state.touchState[key])))) ||
      false;
    const reached = state.stepReachState[step.label] || false;

    return { ...step, isValid, isTouched, reached };
  });

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
        const newState = {
          ...state,
          form: { ...state.form, [key]: event.target.value },
          touchState: { ...state.touchState, [key]: true },
        };
        setState(newState);
      },
      onBlur: (event: FormEvent<MarketCreationFormData[K]>) => {
        if (mode === "onChange") return;
        const newState = {
          ...state,
          form: { ...state.form, [key]: event.target.value },
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
    input,
    fieldsState,
    isValid,
  };
};
