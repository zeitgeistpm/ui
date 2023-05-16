import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { useCreateMarketState } from "lib/state/market-creation";
import {
  CreateMarketFormData,
  CurrencySectionFormData,
  QuestionSectionFormData,
} from "lib/state/market-creation/types";
import { Controller, useForm } from "react-hook-form";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import { MarketFormSection } from "./inputs/Section";
import {
  createMarketWizardSteps,
  nextStepFrom,
  prevStepFrom,
} from "./inputs/types";
import { useEffect, useLayoutEffect } from "react";

const MarketCreationForm = () => {
  const state = useCreateMarketState();

  const {
    register,
    watch,
    getFieldState,
    handleSubmit,
    formState: { errors, isDirty, isValid, isLoading, touchedFields },
  } = useForm<CreateMarketFormData>({
    mode: "onChange",
  });

  const currencyState = getFieldState("currency");
  const questionState = getFieldState("question");
  const tagsState = getFieldState("tags");

  const prevStep = prevStepFrom(state.step);
  const nextStep = nextStepFrom(state.step);

  const back = () => {
    if (prevStep) {
      state.merge({ step: prevStep });
    }
  };

  const next = () => {
    if (nextStep) {
      state.merge({ step: nextStep });
    }
  };

  const onSubmit = (data: any) => {
    console.log(data);
  };

  console.log(tagsState);

  return (
    <div>
      <div className="flex center mb-12">
        <div className="mr-3 font-light">One Page</div>
        <Toggle
          checked={state.wizardModeOn}
          onChange={(wizardModeOn) => state.merge({ wizardModeOn })}
          activeClassName="bg-green-400"
        />
        <div className="ml-3 font-light">Wizard</div>
      </div>

      <div className="mb-12">
        {state.wizardModeOn && (
          <WizardStepper
            steps={createMarketWizardSteps}
            current={state.step}
            onChange={(step) => state.merge({ step })}
          />
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          className={`mb-16 ${
            state.step.label == "Currency" || !state.wizardModeOn
              ? "block"
              : "hidden"
          }`}
        >
          <MarketFormSection<CurrencySectionFormData>
            wizard={state.wizardModeOn}
            onClickNext={next}
            nextDisabled={currencyState.invalid || !currencyState.isTouched}
          >
            <CurrencySelect
              options={["ZTG", "DOT"]}
              value={watch("currency")}
              {...register("currency", {
                required: true,
              })}
            />
          </MarketFormSection>
        </div>

        <div
          className={`mb-16 ${
            state.step.label == "Question" || !state.wizardModeOn
              ? "block"
              : "hidden"
          }`}
        >
          <MarketFormSection<QuestionSectionFormData>
            wizard={state.wizardModeOn}
            onClickNext={next}
            onClickBack={back}
            nextDisabled={
              !isDirty ||
              questionState.invalid ||
              tagsState.invalid ||
              !questionState.isTouched ||
              !tagsState.isTouched
            }
          >
            <div className="mb-8 text-center">
              <h2 className="mb-8 text-md">What is your question?</h2>
              <div>
                <input
                  className="h-12 w-2/3 text-center bg-green-100 rounded-md mb-2"
                  placeholder="When do I send it?"
                  type="text"
                  {...register("question", {
                    required: {
                      value: true,
                      message: "Question is required.",
                    },
                    maxLength: {
                      value: 240,
                      message: "Question must be less than 240 characters.",
                    },
                    minLength: {
                      value: 10,
                      message: "Question must be more than 10 characters.",
                    },
                  })}
                />
                <div className="flex center h-5 text-xs text-red-400">
                  {questionState.isDirty &&
                    questionState.error &&
                    questionState.error.message}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <CategorySelect
                value={watch("tags")}
                {...register("tags", {
                  required: {
                    value: true,
                    message: "Please select at least one category.",
                  },
                })}
              />
            </div>
            <div className="flex center h-5 text-xs text-red-400">
              {tagsState.isDirty && tagsState.error && tagsState.error.message}
            </div>
          </MarketFormSection>
        </div>

        <div className="flex center mt-24">
          <button className="bg-blue-300 rounded-sm p-2 mx-auto" type="submit">
            Test Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketCreationForm;
