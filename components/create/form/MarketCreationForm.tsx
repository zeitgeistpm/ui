import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { FieldState, useCreateMarketState } from "lib/state/market-creation";
import { FormEventHandler } from "react";
import { MarketFormSection } from "./MarketFormSection";
import { AnswersInput } from "./inputs/Answers";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import { MarketCreationStep } from "lib/state/market-creation/types/step";
import DateTimePicker from "./inputs/DateTime";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import { NUM_BLOCKS_IN_DAY } from "lib/constants";

const MarketCreationForm = () => {
  const {
    isWizard,
    form,
    setWizard,
    currentStep,
    steps,
    setStep,
    register,
    fieldsState,
    reset,
    touchState,
  } = useCreateMarketState();

  const back = () => {
    const prevStep = prevStepFrom(steps, currentStep);
    if (prevStep) {
      setStep(prevStep);
    }
  };

  const next = () => {
    const nextStep = nextStepFrom(steps, currentStep);
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    console.log("submit");
  };

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
        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Currency"}
          onClickNext={next}
          nextDisabled={!fieldsState.currency.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="text-base">Market Currency</h2>
          </div>
          <CurrencySelect options={["ZTG", "DOT"]} {...register("currency")} />
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Question"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={
            !fieldsState.question.isValid || !fieldsState.tags.isValid
          }
        >
          <div className="mb-8 text-center">
            <h2 className="mb-8 text-base">What is your question?</h2>
            <div>
              <input
                className="h-12 w-2/3 text-center bg-nyanza-base rounded-md mb-2"
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

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Answers"}
          onClickNext={next}
          nextDisabled={!fieldsState.answers.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="text-base">Answers</h2>
          </div>
          <div className="mb-6">
            <AnswersInput {...register("answers", { mode: "onChange" })} />
          </div>
          <div className="flex center h-5 text-xs text-red-400">
            <ErrorMessage field={fieldsState.answers} />
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Time Period"}
          onClickNext={next}
          nextDisabled={!fieldsState.endDate.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="text-base">When does the market end?</h2>
          </div>
          <div className="mb-12 flex center">
            <DateTimePicker
              placeholder="Set End Date"
              isValid={fieldsState.endDate.isValid}
              {...register("endDate", { mode: "all" })}
            />
            <div className="flex center h-5  text-xs text-red-400">
              <ErrorMessage field={fieldsState.endDate} />
            </div>
          </div>
          <div className="mb-12">
            <div className="mb-4 text-center">
              <h2 className="text-base">Set Grace Period</h2>
            </div>
            <div className="flex center">
              <BlockPeriodPicker
                isValid={fieldsState.gracePeriod.isValid}
                options={[
                  { type: "blocks", label: "None", value: 0 },
                  {
                    type: "blocks",
                    label: "1 Day",
                    value: NUM_BLOCKS_IN_DAY * 1,
                  },
                  {
                    type: "blocks",
                    label: "3 Days",
                    value: NUM_BLOCKS_IN_DAY * 3,
                  },
                ]}
                {...register("gracePeriod", { mode: "all" })}
              />
            </div>
            <div className="flex center h-5 mt-4 text-xs text-red-400">
              <ErrorMessage field={fieldsState.gracePeriod} />
            </div>
          </div>
          <div className="mb-12">
            <div className="mb-4 text-center">
              <h2 className="text-base">Set Report Period</h2>
            </div>
            <div className="flex center">
              <BlockPeriodPicker
                isValid={fieldsState.reportingPeriod.isValid}
                options={[
                  { type: "blocks", label: "None", value: 0 },
                  {
                    type: "blocks",
                    label: "1 Day",
                    value: NUM_BLOCKS_IN_DAY * 1,
                  },
                  {
                    type: "blocks",
                    label: "3 Days",
                    value: NUM_BLOCKS_IN_DAY * 3,
                  },
                ]}
                {...register("reportingPeriod", { mode: "all" })}
              />
            </div>
            <div className="flex center h-5 mt-4 text-xs text-red-400">
              <ErrorMessage field={fieldsState.reportingPeriod} />
            </div>
          </div>
          <div className="mb-0">
            <div className="mb-4 text-center">
              <h2 className="text-base">Set Dispute Period</h2>
            </div>
            <div className="flex center">
              <BlockPeriodPicker
                isValid={fieldsState.disputePeriod.isValid}
                options={[
                  { type: "blocks", label: "None", value: 0 },
                  {
                    type: "blocks",
                    label: "1 Day",
                    value: NUM_BLOCKS_IN_DAY * 1,
                  },
                  {
                    type: "blocks",
                    label: "3 Days",
                    value: NUM_BLOCKS_IN_DAY * 3,
                  },
                ]}
                {...register("disputePeriod", { mode: "all" })}
              />
            </div>
            <div className="flex center h-5 mt-4 text-xs text-red-400">
              <ErrorMessage field={fieldsState.disputePeriod} />
            </div>
          </div>
        </MarketFormSection>
      </form>
    </div>
  );
};

const ErrorMessage = ({ field }: { field: FieldState }) => {
  return <>{field.errors && field.isTouched && field.errors[0]}</>;
};

export default MarketCreationForm;
