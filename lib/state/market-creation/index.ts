import { FormEvent } from "components/create/form/types";
import { useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";
import {
  CreateMarketState,
  FieldsState,
  MarketCreationFormData,
  MarketCreationStep,
  getSectionFormKeys,
  marketCreationSteps,
  validate,
} from "./types";

export const defaultState: CreateMarketState = {
  isWizard: true,
  currentStep: { label: "Currency", isValid: false },
  form: {},
  touchState: {},
};

const createMarketStateAtom = persistentAtom<CreateMarketState>({
  key: "market-creation-form",
  defaultValue: defaultState,
  /**
   * Todo: remove reset migrations before merge to staging, only for resetting state between preview builds
   */
  migrations: [() => defaultState],
});

export const useCreateMarketState = () => {
  const [state, setState] = useAtom(createMarketStateAtom);

  const fieldsState: FieldsState = {
    currency: {
      ...validate("currency", state.form),
      isTouched: state.touchState.currency,
    },
    question: {
      ...validate("question", state.form),
      isTouched: state.touchState.question,
    },
    tags: {
      ...validate("tags", state.form),
      isTouched: state.touchState.tags,
    },
    answers: {
      ...validate("answers", state.form),
      isTouched: state.touchState.answers,
    },
  };

  const isValid = Object.values(fieldsState).every((field) => field.isValid);

  const steps = marketCreationSteps.map((step) => {
    const keys = getSectionFormKeys(step.label);
    const isValid =
      keys.length && keys.every((key) => fieldsState[key].isValid);
    return { ...step, isValid };
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
