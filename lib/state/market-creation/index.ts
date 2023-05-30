import { FormEvent } from "components/create/form/types";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { persistentAtom } from "../util/persistent-atom";
import {
  gracePeriodOptions,
  reportingPeriodOptions,
} from "./constants/deadline-options";
import { cloneDeep, last, merge } from "lodash-es";
import { FieldsState, initialFieldsState } from "./types/fieldstate";
import { MarketCreationFormData, marketCreationFormKeys } from "./types/form";
import {
  MarketCreationStep,
  MarketCreationStepType,
  marketCreationSteps,
  stepForFormKey,
  stepFormKeys,
} from "./types/step";
import { useMarketCreationFormValidator } from "./types/validation";
import Decimal from "decimal.js";
import moment from "moment";
import { usePrevious } from "lib/hooks/usePrevious";

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
  steps: MarketCreationStep[];
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
   * Has any of the form fields been touched(edited) by the user.
   */
  isTouched: boolean;
  /**
   * Reset the form state.
   */
  reset: () => void;
  /**
   * Set the step the user is on.
   */
  setStep: (step: MarketCreationStep) => void;
  /**
   * Set the step the user is on by the section name.
   */
  goToSection: (stepType: MarketCreationStepType) => void;

  provideFormData: (data: Partial<MarketCreationFormData>) => void;
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
    fieldState: FieldsState[K];
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
    oracle: "",
    gracePeriod: gracePeriodOptions[0],
    reportingPeriod: reportingPeriodOptions[1],
    disputePeriod: reportingPeriodOptions[1],
    liquidity: {
      deploy: true,
      rows: [],
    },
  },
  touchState: {},
  stepReachState: {
    Currency: true,
  },
};

const createMarketStateAtom = persistentAtom<MarketCreationState>({
  key: "market-creation-form",
  defaultValue: cloneDeep(defaultState),
  migrations: [
    /**
     * TODO: remove before merging to staging.
     */
    () => defaultState,
    () => defaultState,
    () => defaultState,
    () => defaultState,
    () => defaultState,
  ],
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

  const isTouched = Object.values(fieldsState).some((field) => field.isTouched);
  const isValid = Object.values(fieldsState).every((field) => field.isValid);

  const steps = marketCreationSteps.map((step) => {
    const keys = stepFormKeys[step.label];

    const reached = state.stepReachState[step.label] || false;
    const isValid = keys.every((key) => fieldsState[key].isValid);
    const isTouched = keys.some((key) => state.touchState[key]);

    return { ...step, isValid, isTouched, reached };
  });

  const goToSection = (stepType: MarketCreationStepType) => {
    const step = steps.find((s) => s.label === stepType);
    if (step) {
      setStep(step);
    }
  };

  const provideFormData = (data: Partial<MarketCreationFormData>) => {
    setState({
      ...state,
      form: merge(state.form, data),
    });
  };

  const reset = () => {
    setState(
      merge(cloneDeep(defaultState), {
        isWizard: state.isWizard,
        form: {
          question: "",
          oracle: "",
        },
      }),
    );
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
      fieldState: fieldsState[key],
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

  const prevAnswersLength = usePrevious(state.form.answers?.answers?.length);

  /**
   * Update liquidity rows when answers changes.
   *
   * If only answer values(option strings or scalar values) have changes it will not reset the liquidity amounts or prices.
   * If the number of answers changes it will reset the liquidity amounts and prices.
   */
  useEffect(() => {
    const baseAmmount = "100";
    const baseWeight = 64;

    const numOutcomes = state.form.answers.answers.length;

    const ratio = 1 / numOutcomes;
    const weight = ratio * baseWeight;

    const baseAssetLiquidty = last(state.form.liquidity?.rows);

    const isScalar = state.form.answers.type === "scalar";
    const scalarNumberType =
      state.form.answers.type === "scalar" && state.form.answers.numberType;

    const resetPrices = prevAnswersLength !== numOutcomes;

    const rows = [
      ...state.form.answers.answers.map((answer, index) => {
        const liquidity = state.form.liquidity?.rows[index];
        const amount = new Decimal(
          resetPrices
            ? baseAmmount
            : state.form.liquidity?.rows[index]?.amount ?? baseAmmount,
        );

        const price = resetPrices
          ? ratio.toString()
          : liquidity?.price?.price ?? ratio.toString();

        return {
          asset: !isScalar
            ? answer
            : `${index === 0 ? "S" : "L"}[${
                scalarNumberType === "timestamp"
                  ? moment(answer).format("MMM Do, YYYY hh:mm a")
                  : answer
              }]`,
          weight: weight.toFixed(0),
          amount: amount.toString(),
          price: {
            price: price,
            locked: liquidity?.price?.locked ?? false,
          },
          value: `${amount.mul(ratio).toFixed(4)}`,
        };
      }),
      {
        asset: state.form.currency,
        weight: baseWeight.toString(),
        amount: resetPrices
          ? baseAmmount
          : baseAssetLiquidty?.amount ?? baseAmmount,
        price: {
          price: resetPrices ? "1" : baseAssetLiquidty?.price?.price ?? "1",
          locked: true,
        },
        value: baseAmmount,
      },
    ];

    setState({
      ...state,
      form: {
        ...state.form,
        liquidity: {
          ...state.form.liquidity,
          rows,
        },
      },
    });
  }, [state.form.answers, state.form.currency]);

  return {
    form: state.form,
    currentStep: state.currentStep,
    isWizard: state.isWizard,
    steps,
    fieldsState,
    isValid,
    isTouched,
    reset,
    setStep,
    goToSection,
    provideFormData,
    setWizard,
    input,
  };
};
