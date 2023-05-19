import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { NUM_BLOCKS_IN_DAY, NUM_BLOCKS_IN_HOUR } from "lib/constants";
import { FieldState, useCreateMarketState } from "lib/state/market-creation";
import { MarketCreationStep } from "lib/state/market-creation/types/step";
import { FormEventHandler } from "react";
import { MarketFormSection } from "./MarketFormSection";
import { AnswersInput } from "./inputs/Answers";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import DateTimePicker from "./inputs/DateTime";
import { Transition } from "@headlessui/react";

const MarketCreationForm = () => {
  const {
    isWizard,
    setWizard,
    currentStep,
    steps,
    setStep,
    input,
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
          <CurrencySelect options={["ZTG", "DOT"]} {...input("currency")} />
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
                className="h-12 w-2/3 text-center bg-nyanza-base rounded-md mb-4"
                placeholder="When do I send it?"
                {...input("question", { type: "text" })}
              />
              <div className="flex center h-5 text-xs text-red-400">
                <ErrorMessage field={fieldsState.question} />
              </div>
            </div>
          </div>
          <div className="mb-6">
            <CategorySelect {...input("tags")} />
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
            <AnswersInput {...input("answers", { mode: "onChange" })} />
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
          <div className="mb-12 ">
            <div className="flex center mb-3">
              <DateTimePicker
                placeholder="Set End Date"
                isValid={fieldsState.endDate.isValid}
                {...input("endDate", { mode: "all" })}
              />
            </div>
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
                {...input("gracePeriod", { mode: "all" })}
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
                  {
                    type: "blocks",
                    label: "1 Hour",
                    value: NUM_BLOCKS_IN_HOUR,
                  },
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
                {...input("reportingPeriod", { mode: "all" })}
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
                {...input("disputePeriod", { mode: "all" })}
              />
            </div>
            <div className="flex center h-5 mt-4 text-xs text-red-400">
              <ErrorMessage field={fieldsState.disputePeriod} />
            </div>
          </div>
        </MarketFormSection>
        <div className="flex center">
          <button type="button" className="text-blue-500" onClick={reset}>
            reset form
          </button>
        </div>
      </form>
    </div>
  );
};

const ErrorMessage = ({ field }: { field: FieldState }) => {
  return (
    <Transition
      show={Boolean(field.errors && field.isTouched)}
      enter="transition-opacity duration-250"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-250"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <span>{field?.errors?.[0]}</span>
    </Transition>
  );
};

export default MarketCreationForm;
