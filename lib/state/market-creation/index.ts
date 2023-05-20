import { FormEvent } from "components/create/form/types";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { persistentAtom } from "../util/persistent-atom";
import {
  MarketCreationFormData,
  marketCreationFormKeys,
  useMarketCreationFormValidator,
} from "./types/form";
import { sectionOfFormKey, sections } from "./types/section";
import {
  MarketCreationStep,
  MarketCreationStepType,
  marketCreationSteps,
} from "./types/step";
import { FieldsState, initialFieldsState } from "./types/field-state";

export type CreateMarketState = {
  currentStep: MarketCreationStep;
  isWizard: boolean;
  form: Partial<MarketCreationFormData>;
  touchState: Partial<Record<keyof MarketCreationFormData, boolean>>;
  stepReachState: Partial<Record<MarketCreationStepType, boolean>>;
};

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
    const keys = sections[step.label];

    const isValid = keys.length
      ? keys.every((key) => fieldsState[key].isValid)
      : true;

    const isTouched = keys.length
      ? Boolean(keys.find((key) => Boolean(state.touchState[key])))
      : false;

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
        let newState = {
          ...state,
          form: { ...state.form, [key]: event.target.value },
          touchState: { ...state.touchState, [key]: true },
        };
        if (!state.isWizard) {
          const section = sectionOfFormKey(key);
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
          const section = sectionOfFormKey(key);
          newState.stepReachState[section] = true;
        }
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
