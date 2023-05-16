import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { useCreateMarketState } from "lib/state/market-creation";
import {
  MarketCreationForm,
  MarketCreationStep,
  MarketCreationStepType,
  CurrencySectionForm,
  QuestionAndCategorySectionForm,
  marketCreationSteps,
} from "lib/state/market-creation/types";
import { useEffect, useMemo, useState } from "react";
import { UseFormGetFieldState, useForm } from "react-hook-form";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import { MarketFormSection } from "./inputs/Section";

type FieldState = Omit<ReturnType<UseFormGetFieldState<any>>, "error">;

const getSectionFieldsState = (sections: Array<FieldState>): FieldState => {
  return sections.reduce(
    (acc, section) => {
      return {
        invalid: acc.invalid || section.invalid,
        isDirty: acc.isDirty || section.isDirty,
        isTouched: acc.isTouched || section.isTouched,
      };
    },
    {
      invalid: false,
      isDirty: false,
      isTouched: false,
    },
  );
};

const sectionCompleted = (section: FieldState) =>
  !(!section.isDirty || !section.isTouched || section.invalid);

const MarketCreationForm = () => {
  const state = useCreateMarketState();

  const {
    register,
    watch,
    getFieldState,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors, isDirty, isValid, isLoading, touchedFields },
  } = useForm<MarketCreationForm>({
    mode: "all",
  });

  const [currentStep, setCurrentStep] = useState<MarketCreationStep>({
    label: "Currency",
    isValid: false,
  });

  const [wizardModeOn, setWizardModeOn] = useState(true);

  const currencyState = getFieldState("currency");
  const questionState = getFieldState("question");
  const tagsState = getFieldState("tags");

  console.log(currencyState);

  const currencySection = getSectionFieldsState([currencyState]);

  const questionAndCategorySectionState = getSectionFieldsState([
    questionState,
    tagsState,
  ]);

  const sectionValidityIndex: {
    [key in MarketCreationStepType]: boolean;
  } = {
    Currency: sectionCompleted(currencySection),
    Question: sectionCompleted(questionAndCategorySectionState),
    Answers: false,
    "Time Period": false,
    Oracle: false,
    Description: false,
    Moderation: false,
    Preview: false,
  };

  const steps = useMemo(() => {
    return marketCreationSteps.map((step) => {
      return {
        ...step,
        isValid: sectionValidityIndex[step.label],
      };
    });
  }, [watch()]);

  const step = useMemo(() => {
    return {
      ...currentStep,
      isValid: sectionValidityIndex[currentStep.label],
    };
  }, [steps]);

  const back = () => {
    const prevStep = prevStepFrom(steps, step);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  const next = () => {
    const nextStep = nextStepFrom(steps, step);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <div>
      <div className="flex center mb-12">
        <div className="mr-3 font-light">One Page</div>
        <Toggle
          checked={wizardModeOn}
          onChange={(wizardModeOn) => setWizardModeOn(wizardModeOn)}
          activeClassName="bg-green-400"
        />
        <div className="ml-3 font-light">Wizard</div>
      </div>

      <div className="mb-12">
        {wizardModeOn && (
          <WizardStepper
            steps={steps}
            current={step}
            onChange={(step: MarketCreationStep) => setCurrentStep(step)}
          />
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          className={`mb-16 ${
            step.label == "Currency" || !wizardModeOn ? "block" : "hidden"
          }`}
        >
          <MarketFormSection<CurrencySectionForm>
            wizard={wizardModeOn}
            onClickNext={next}
            nextDisabled={!sectionValidityIndex["Currency"]}
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
            step.label == "Question" || !wizardModeOn ? "block" : "hidden"
          }`}
        >
          <MarketFormSection<QuestionAndCategorySectionForm>
            wizard={wizardModeOn}
            onClickNext={next}
            onClickBack={back}
            nextDisabled={!sectionValidityIndex["Question"]}
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
      </form>
    </div>
  );
};

export default MarketCreationForm;
