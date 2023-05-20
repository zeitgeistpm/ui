import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { NUM_BLOCKS_IN_DAY, NUM_BLOCKS_IN_HOUR } from "lib/constants";
import { useCreateMarketState } from "lib/state/market-creation";
import { MarketCreationStep } from "lib/state/market-creation/types/step";
import { FormEventHandler } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { MarketFormSection } from "./MarketFormSection";
import MarketPreview from "./Preview";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import DateTimePicker from "./inputs/DateTime";
import ModerationModeSelect from "./inputs/Moderation";
import { AnswersInput } from "./inputs/answers";
import dynamic from "next/dynamic";

const QuillEditor = dynamic(() => import("components/ui/QuillEditor"), {
  ssr: false,
});

export const MarketCreationForm = () => {
  const {
    isWizard,
    setWizard,
    currentStep,
    steps,
    setStep,
    input,
    fieldsState,
    reset,
    form,
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
            onChange={(step) => setStep(step)}
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
          nextDisabled={
            !fieldsState.endDate.isValid ||
            !fieldsState.gracePeriod.isValid ||
            !fieldsState.reportingPeriod.isValid ||
            !fieldsState.disputePeriod.isValid
          }
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

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Oracle"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={
            !fieldsState.oracle.isValid || !fieldsState.oracle.isValid
          }
        >
          <div className="mb-8 text-center">
            <h2 className="mb-8 text-base">Set Up Oracle</h2>
            <p className="mb-12 text-sm text-gray-500 font-light">
              This is the account that will be{" "}
              <b className="font-semibold text-gray-600">
                responsible for submitting the outcome
              </b>{" "}
              when the market ends. <br /> If the Oracle fails to submit, you
              will lose some of your deposit.
            </p>
            <div>
              <input
                className="h-12 w-2/3 text-center bg-nyanza-base rounded-md mb-4"
                placeholder="0x78e0e162...D3FFd434F7"
                {...input("oracle", { type: "text" })}
              />
              <div className="flex center h-5 text-xs text-red-400">
                <ErrorMessage field={fieldsState.oracle} />
              </div>
            </div>
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Description"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={!fieldsState.description.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="mb-8 text-base">Market Description</h2>
            <div>
              <div className="flex center min-w-full">
                <QuillEditor
                  className="max-w-full w-full md:w-2/3 h-48"
                  placeHolder={
                    "Additional information you want to provide about the market, such as resolution source, special cases, or other details."
                  }
                  {...input("description")}
                />
              </div>
              <div className="flex center h-5 text-xs text-red-400">
                <ErrorMessage field={fieldsState.description} />
              </div>
            </div>
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Moderation"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={!fieldsState.moderation.isValid}
        >
          <div className="mb-8 text-center">
            <h2 className="mb-8 text-base">Market Moderation</h2>
            <div>
              <div className="flex center min-w-full">
                <ModerationModeSelect {...input("moderation")} />
              </div>
              <div className="flex center h-5 text-xs text-red-400">
                <ErrorMessage field={fieldsState.moderation} />
              </div>
            </div>
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Preview"}
          onClickBack={back}
        >
          <div className="flex center mb-8">
            <MarketPreview form={form} />
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

export default MarketCreationForm;
