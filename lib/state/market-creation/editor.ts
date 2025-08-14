import { FormEvent } from "components/create/editor/types";
import Decimal from "decimal.js";
import { usePrevious } from "lib/hooks/usePrevious";
import { merge } from "lodash-es";
import { useEffect, useMemo } from "react";
import { minBaseLiquidity } from "./constants/currency";
import * as MarketDraft from "./types/draft";
import * as FieldsState from "./types/fieldstate";
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
  sectionForFormKey,
  stepFormKeys,
} from "./types/step";
import { useMarketCreationFormValidator } from "./types/validation";
import { tickersForAnswers } from "./util/tickers";
import { DeepPartial } from "lib/types/deep-partial";
import { persistentAtom } from "../util/persistent-atom";
import { useAtom } from "jotai";

/**
 * The market draft editor.
 * Is a union of the base editor and the current state of the form which can be partial and invalid or full data and valid.
 */
export type MarketDraftEditor = BaseMarketDraftEditor &
  (ValidFormState | InvalidFormState);

export type BaseMarketDraftEditor = {
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
  fieldsState: FieldsState.FieldsState;
  /**
   * Has any of the form fields been touched(edited) by the user.
   */
  isTouched: boolean;
  /**
   * Is the market creation mode in wizard mode or not.
   */
  isWizard: boolean;
  /**
   * Is the market created on chain?
   */
  isPublished: boolean;
  /**
   * The market id of the market. Will be set when its published successfully.
   */
  marketId?: number;
  /**
   * Set the market draft as published.
   */
  published: (marketId: number) => void;
  /**
   * Reset the form draft.
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
   * Merge partial form data into the form draft.
   */
  mergeFormData: (data: DeepPartial<MarketFormData>) => void;
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
    fieldState: FieldsState.FieldsState[K];
  };
};

export type ValidFormState = {
  /**
   * The current state of the form data.
   * Ensured to be full data in valid draft.
   */
  form: ValidMarketFormData;
  /**
   * Is the form as a whole valid.
   * Ensured to be true in valid draft.
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
   * Ensured to be false in invalid draft.
   */
  isValid: false;
};

/**
 * The config for the market draft editor.
 * Simple interface for the current state of the market draft and a function to update the state.
 *
 * @note Useful if we want to have editing of multiple drafts from a list of drafts and can change the current draft.
 */
export type MarketDraftEditorConfig = {
  draft: MarketDraft.MarketDraftState;
  update: (state: MarketDraft.MarketDraftState) => void;
};

const createMarketStateAtom = persistentAtom<MarketDraft.MarketDraftState>({
  key: "market-creation-form",
  defaultValue: MarketDraft.empty(),
  migrations: [() => MarketDraft.empty(), () => MarketDraft.empty()],
});

export const useMarketDraftEditor = (): MarketDraftEditor => {
  const [draft, update] = useAtom(createMarketStateAtom);
  const validator = useMarketCreationFormValidator(draft.form);

  const fieldsState = useMemo<FieldsState.FieldsState>(() => {
    if (!validator) return FieldsState.empty();

    const parsed = validator.safeParse(draft.form);

    const fieldsState = marketCreationFormKeys.reduce<FieldsState.FieldsState>(
      (fieldsState, key) => {
        let isValid = true;
        let isTouched = draft.touchState[key];
        let errors = [...(fieldsState[key].errors ?? [])];

        if (parsed?.success !== true) {
          const issue = parsed?.error.issues.find(
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
      FieldsState.empty(),
    );

    return fieldsState;
  }, [draft.form, validator]);

  const isTouched = Object.values(fieldsState).some((field) => field.isTouched);
  const isValid = Object.values(fieldsState).every((field) => field.isValid);

  const steps = marketCreationSteps.map((step) => {
    const keys = stepFormKeys[step.label];
    const reached = draft.stepReachState[step.label] || false;
    const isValid = keys.every((key) => fieldsState[key].isValid);
    const isTouched = keys.some((key) => draft.touchState[key]);

    return { ...step, isValid, isTouched, reached };
  });

  const goToSection = (stepType: MarketCreationStepType) => {
    const step = steps.find((s) => s.label === stepType);
    if (step) {
      setStep(step);
    }
  };

  const mergeFormData = (data: Partial<MarketFormData>) => {
    update({
      ...draft,
      form: merge(draft.form, data),
    });
  };

  const reset = () => {
    update(
      merge(MarketDraft.empty(), {
        isWizard: draft.isWizard,
        form: {
          question: "",
          oracle: "",
        },
      }),
    );
  };

  const toggleWizard = (on: boolean) => {
    let newDraft = { ...draft, isWizard: on };
    if (on) {
      const firstInvalidStep = steps.find((step) => !step.isValid);
      newDraft.currentStep = firstInvalidStep || draft.currentStep;
    }
    update({ ...newDraft });
  };

  const setStep = (step: MarketCreationStep) =>
    update({
      ...draft,
      currentStep: step,
      stepReachState: {
        ...draft.stepReachState,
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
      const value = draft.form?.[key];
      if (value === "") {
        mode = "onChange";
      }
    }

    return {
      name: key,
      value: draft.form?.[key],
      fieldState: fieldsState[key],
      onChange: (event: FormEvent<MarketFormData[K]>) => {
        if (mode === "onBlur") return;
        let newDraft = {
          ...draft,
          form: { ...draft.form, [key]: event.target.value },
          touchState: { ...draft.touchState, [key]: true },
        };
        if (!draft.isWizard) {
          const section = sectionForFormKey(key);
          section && (newDraft.stepReachState[section] = true);
        }
        update(newDraft);
      },
      onBlur: (event: FormEvent<MarketFormData[K]>) => {
        if (mode === "onChange") return;
        let newDraft = {
          ...draft,
          form: { ...draft.form, [key]: event.target.value },
          touchState: { ...draft.touchState, [key]: true },
        };
        if (!draft.isWizard) {
          const section = sectionForFormKey(key);
          if (section) {
            newDraft.stepReachState[section] = true;
          }
        }
        update(newDraft);
      },
    };
  };

  /**
   * Set the market as published.
   */
  const published = (marketId: number) => {
    update({
      ...draft,
      marketId,
      isPublished: true,
    });
  };

  /**
   * Update liquidity rows when answers changes.
   *
   * If only answer values(option strings or scalar values) have changes it will not reset the liquidity amounts or prices.
   * If the number of answers changes it will reset the liquidity amounts and prices.
   */
  const prevCurrency = usePrevious(draft.form.currency);
  const prevAnswersLength = usePrevious(draft.form.answers?.answers?.length);

  useEffect(() => {
    if (!draft.form.answers || !draft.form.liquidity) return;

    const baseAmount = minBaseLiquidity[draft.form.currency!]
      ? `${minBaseLiquidity[draft.form.currency!]}`
      : "100";

    const liquidity =
      minBaseLiquidity[draft.form.currency!]?.toString() ?? "100";
    
      const numOutcomes = draft.form.answers.answers.length;
    const ratio = 1 / numOutcomes;
    const reset =
      prevAnswersLength !== numOutcomes || prevCurrency !== draft.form.currency;

    const tickers = tickersForAnswers(draft.form.answers);

    const rows = [
      ...draft.form.answers.answers.map((answer, index) => {
        const liquidity = draft.form.liquidity?.rows?.[index];

        const amount = new Decimal(
          reset
            ? baseAmount
            : draft.form.liquidity?.rows?.[index]?.amount || baseAmount,
        );

        const price = reset
          ? ratio.toString()
          : liquidity?.price?.price ?? ratio.toString();

        return {
          asset: tickers?.[index]?.ticker ?? answer,
          amount: amount.toString(),
          price: {
            price: price,
            locked: liquidity?.price?.locked ?? false,
          },
          value: `${amount.mul(ratio).toFixed(4)}`,
        };
      }),
    ];
    update({
      ...draft,
      form: {
        ...draft.form,
        liquidity: {
          ...draft.form.liquidity,
          amount: draft.form.liquidity.amount || liquidity,
          rows,
        },
      },
    });
  }, [draft.form.answers, draft.form.currency]);

  const editor: BaseMarketDraftEditor = {
    currentStep: draft.currentStep,
    isWizard: draft.isWizard,
    isPublished: draft.isPublished,
    marketId: draft.marketId,
    steps,
    fieldsState,
    isTouched,
    reset,
    setStep,
    goToSection,
    mergeFormData,
    toggleWizard,
    input,
    published,
  };

  let formState: ValidFormState | InvalidFormState;

  if (isValid) {
    formState = {
      form: draft.form as ValidMarketFormData,
      isValid,
    };
  } else {
    formState = {
      form: draft.form,
      isValid: false,
    };
  }

  return {
    ...editor,
    ...formState,
  };
};
