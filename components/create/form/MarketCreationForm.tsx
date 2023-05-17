import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import {
  nextInvalidStepFrom,
  nextStepFrom,
  prevStepFrom,
} from "components/wizard/types";
import { useCreateMarketState } from "lib/state/market-creation";
import {
  CurrencySectionFormData,
  FieldState,
  FieldsState,
  MarketCreationFormData,
  MarketCreationStep,
  QuestionAndCategorySectionFormData,
} from "lib/state/market-creation/types";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import { MarketFormSection } from "./MarketFormSection";
import { FormEventHandler } from "react";
import { AnswersInput } from "./inputs/Answers";

const MarketCreationForm = () => {
  const {
    isWizard,
    setWizard,
    currentStep,
    steps,
    setStep,
    register,
    fieldsState,
    reset,
  } = useCreateMarketState();

  const back = () => {
    const prevStep = prevStepFrom(steps, currentStep);
    if (prevStep) {
      setStep(prevStep);
    }
  };

  const next = () => {
    const nextStep = nextInvalidStepFrom(steps, currentStep);
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    console.log("submit");
  };

  console.log(fieldsState);

  return (
    <div>
      <div className="flex center mb-4">
        <div className="mr-3 font-light">One Page</div>
        <Toggle
          checked={isWizard}
          onChange={setWizard}
          activeClassName="bg-green-400"
        />
        <div className="ml-3 font-light">Wizard</div>
      </div>

      <div className="mb-12">
        {isWizard && (
          <WizardStepper
            steps={steps}
            current={currentStep}
            onChange={(step: MarketCreationStep) => setStep(step)}
          />
        )}
      </div>

      <form onSubmit={onSubmit}>
        <MarketFormSection<CurrencySectionFormData>
          wizard={isWizard}
          isCurrent={currentStep.label == "Currency"}
          onClickNext={next}
          nextDisabled={!fieldsState.currency.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="text-md">Market Currency</h2>
          </div>
          <CurrencySelect options={["ZTG", "DOT"]} {...register("currency")} />
        </MarketFormSection>

        <MarketFormSection<QuestionAndCategorySectionFormData>
          wizard={isWizard}
          isCurrent={currentStep.label == "Question"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={
            !fieldsState.question.isValid || !fieldsState.tags.isValid
          }
        >
          <div className="mb-8 text-center">
            <h2 className="mb-8 text-md">What is your question?</h2>
            <div>
              <input
                className="h-12 w-2/3 text-center bg-green-100 rounded-md mb-2"
                placeholder="When do I send it?"
                type="text"
                {...register("question")}
              />
              <div className="flex center h-5 text-xs text-red-400">
                <ErrorMessage field={fieldsState.question} />
              </div>
            </div>
          </div>
          <div className="mb-6">
            <CategorySelect {...register("tags")} />
          </div>
          <div className="flex center h-5 text-xs text-red-400">
            <ErrorMessage field={fieldsState.tags} />
          </div>
        </MarketFormSection>

        <MarketFormSection<CurrencySectionFormData>
          wizard={isWizard}
          isCurrent={currentStep.label == "Answers"}
          onClickNext={next}
          nextDisabled={!fieldsState.answers.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="text-md">Answers</h2>
          </div>
          <AnswersInput {...register("answers", { mode: "onChange" })} />
        </MarketFormSection>
      </form>
    </div>
  );
};

const ErrorMessage = ({ field }: { field: FieldState }) => {
  return <>{field.errors && field.isTouched && field.errors[0]}</>;
};

export default MarketCreationForm;
