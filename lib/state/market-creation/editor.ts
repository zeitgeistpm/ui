import { FormEvent } from "components/create/editor/types";
import Decimal from "decimal.js";
import { usePrevious } from "lib/hooks/usePrevious";
import { last, merge } from "lodash-es";
import moment from "moment";
import { useEffect, useMemo } from "react";
import { minBaseLiquidity } from "./constants/currency";
import * as MarketDraft from "./types/draft";
import { FieldsState, initialFieldsState } from "./types/fieldstate";
import {
  MarketFormData,
  PartialMarketFormData,
  ValidMarketFormData,
  marketCreationFormKeys,
} from "./types/form";
import {
  MarketCreationStep,
  MarketCreationStepType,
  marketCreationSteps,
  stepForFormKey,
  stepFormKeys,
} from "./types/step";
import { useMarketCreationFormValidator } from "./types/validation";
import { tickersForAnswers } from "./util/tickers";

export type MarketDraftEditor = (ValidFormState | InvalidFormState) & {
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
   * Has any of the form fields been touched(edited) by the user.
   */
  isTouched: boolean;
  /**
   * Is the market creation mode in wizard mode or not.
   */
  isWizard: boolean;
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
  /**
   * Merge partial form data into the form state.
   */
  mergeFormData: (data: Partial<MarketFormData>) => void;
  /**
   * Toggle the wizard mode on or off.
   */
  toggleWizard: (on: boolean) => void;
  /**
   * Register a input to a form key.
   */
  input: <K extends keyof MarketFormData>(
    key: K,
    options?: {
      type?: "text" | "number";
      mode?: "onChange" | "onBlur" | "all";
    },
  ) => {
    name: K;
    value: Partial<MarketFormData>[K];
    onChange: (event: FormEvent<MarketFormData[K]>) => void;
    onBlur: (event: FormEvent<MarketFormData[K]>) => void;
    fieldState: FieldsState[K];
  };
};

export type ValidFormState = {
  /**
   * The current state of the form data.
   * Ensured to be full data in valid state.
   */
  form: ValidMarketFormData;
  /**
   * Is the form as a whole valid.
   * Ensured to be true in valid state.
   */
  isValid: true;
};

export type InvalidFormState = {
  /**
   * The current state of the form data.
   * Can be partial data.
   */
  form: PartialMarketFormData;
  /**
   * Is the form as a whole valid.
   * Ensured to be false in invalid state.
   */
  isValid: false;
};

export type MarketDraftConfig = {
  state: MarketDraft.MarketDraftState;
  setState: (state: MarketDraft.MarketDraftState) => void;
};

export const useMarketDraftEditor = ({
  state,
  setState,
}: MarketDraftConfig): MarketDraftEditor => {
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
            errors = [...(fieldsState[key].errors || []), issue];
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

  const mergeFormData = (data: Partial<MarketFormData>) => {
    setState({
      ...state,
      form: merge(state.form, data),
    });
  };

  const reset = () => {
    structuredClone;
    setState(
      merge(MarketDraft.empty(), {
        isWizard: state.isWizard,
        form: {
          question: "",
          oracle: "",
        },
      }),
    );
  };

  const toggleWizard = (on: boolean) => {
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

  const input = <K extends keyof MarketFormData>(
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
      onChange: (event: FormEvent<MarketFormData[K]>) => {
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
      onBlur: (event: FormEvent<MarketFormData[K]>) => {
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

  const prevCurrency = usePrevious(state.form.currency);
  const prevAnswersLength = usePrevious(state.form.answers?.answers?.length);

  /**
   * Update liquidity rows when answers changes.
   *
   * If only answer values(option strings or scalar values) have changes it will not reset the liquidity amounts or prices.
   * If the number of answers changes it will reset the liquidity amounts and prices.
   */
  useEffect(() => {
    const baseAmmount = minBaseLiquidity[state.form.currency]
      ? `${minBaseLiquidity[state.form.currency] / 2}`
      : "100";

    const baseWeight = 64;

    const numOutcomes = state.form.answers.answers.length;

    const ratio = 1 / numOutcomes;

    const baseAssetLiquidty = last(state.form.liquidity?.rows);

    const resetPrices =
      prevAnswersLength !== numOutcomes || prevCurrency !== state.form.currency;

    const tickers = tickersForAnswers(state.form.answers);

    const rows = [
      ...state.form.answers.answers.map((answer, index) => {
        const liquidity = state.form.liquidity?.rows[index];

        const amount = new Decimal(
          resetPrices
            ? baseAmmount
            : state.form.liquidity?.rows[index]?.amount || baseAmmount,
        );

        const price = resetPrices
          ? ratio.toString()
          : liquidity?.price?.price ?? ratio.toString();

        const weight = resetPrices ? ratio * baseWeight : liquidity?.weight || ratio * baseWeight;

        return {
          asset: tickers[index].ticker,
          weight: weight.toString(),
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
          : baseAssetLiquidty?.amount || baseAmmount,
        price: {
          price: "1",
          locked: true,
        },
        value: resetPrices
          ? baseAmmount
          : baseAssetLiquidty?.value || baseAmmount,
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

  const editor = {
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
    mergeFormData,
    toggleWizard,
    input,
  } as MarketDraftEditor & (ValidFormState | InvalidFormState);

  return editor;
};
