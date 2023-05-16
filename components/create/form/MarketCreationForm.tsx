import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { useCreateMarketState } from "lib/state/market-creation";
import {
  CurrencySectionFormData,
  MarketCreationFormData,
  MarketCreationStep,
  QuestionAndCategorySectionFormData,
} from "lib/state/market-creation/types";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import { MarketFormSection } from "./inputs/Section";
import { FormEventHandler } from "react";

const MarketCreationForm = () => {
  const {
    isWizard,
    setWizard,
    steps,
    step,
    setStep,
    form,
    register,
    fieldsState,
  } = useCreateMarketState();

  const back = () => {
    const prevStep = prevStepFrom(steps, step);
    if (prevStep) {
      setStep(prevStep);
    }
  };

  const next = () => {
    const nextStep = nextStepFrom(steps, step);
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    console.log("submit");
  };

  console.log(fieldsState.tags);

  return (
    <div>
      <div className="flex center mb-12">
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
            current={step}
            onChange={(step: MarketCreationStep) => setStep(step)}
          />
        )}
      </div>

      <form onSubmit={onSubmit}>
        <div
          className={`mb-16 ${
            step.label == "Currency" || !isWizard ? "block" : "hidden"
          }`}
        >
          <MarketFormSection<CurrencySectionFormData>
            wizard={isWizard}
            onClickNext={next}
            nextDisabled={!fieldsState.currency.isValid}
          >
            <CurrencySelect
              options={["ZTG", "DOT"]}
              {...register("currency")}
            />
          </MarketFormSection>
        </div>

        <div
          className={`mb-16 ${
            step.label == "Question" || !isWizard ? "block" : "hidden"
          }`}
        >
          <MarketFormSection<QuestionAndCategorySectionFormData>
            wizard={isWizard}
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
                  {fieldsState.question.errors &&
                    fieldsState.question.isTouched &&
                    fieldsState.question.errors[0]}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <CategorySelect {...register("tags")} />
            </div>
            <div className="flex center h-5 text-xs text-red-400">
              {fieldsState.tags.errors &&
                fieldsState.tags.isTouched &&
                fieldsState.tags.errors[0]}
            </div>
          </MarketFormSection>
        </div>
      </form>
    </div>
  );
};

export default MarketCreationForm;
