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
  step: { label: "Currency", isValid: false },
  form: {},
  touchState: {},
};

const createMarketStateAtom = persistentAtom<CreateMarketState>({
  key: "market-creation-form",
  defaultValue: defaultState,
});

export const useCreateMarketState = () => {
  const [state, setState] = useAtom(createMarketStateAtom);

  const setWizard = (on: boolean) => setState({ ...state, isWizard: on });

  const setStep = (step: MarketCreationStep) => setState({ ...state, step });

  const fieldsState: FieldsState = {
    currency: {
      isValid: !!state.form.currency,
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
      isValid: !!state.form.answers,
      isTouched: state.touchState.answers,
    },
  };

  const steps = marketCreationSteps.map((step) => {
    const keys = getSectionFormKeys(step.label);
    const isValid =
      keys.length && keys.every((key) => fieldsState[key].isValid);
    return { ...step, isValid };
  });

  const register = <K extends keyof MarketCreationFormData>(key: K) => {
    const mode = fieldsState.question.isTouched ? "onChange" : "onBlur";
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
    steps,
    setStep,
    setWizard,
    register,
    fieldsState,
  };
};
