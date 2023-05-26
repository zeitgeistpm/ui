import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { useChainTime } from "lib/state/chaintime";
import { useCreateMarketState } from "lib/state/market-creation";
import {
  disputePeriodOptions,
  gracePeriodOptions,
  reportingPeriodOptions,
} from "lib/state/market-creation/constants/deadline-options";
import dynamic from "next/dynamic";
import { FormEventHandler, useState } from "react";
import { ErrorMessage } from "./ErrorMessage";
import InfoPopover from "./InfoPopover";
import { MarketFormSection } from "./MarketFormSection";
import MarketPreview from "./Preview";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import DateTimePicker from "./inputs/DateTime";
import ModerationModeSelect from "./inputs/Moderation";
import { AnswersInput } from "./inputs/answers";
import { Dialog, Transition } from "@headlessui/react";
import { useMarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import Modal from "components/ui/Modal";
import { LiquidityInput } from "./inputs/Liquidity";

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
    isTouched,
  } = useCreateMarketState();

  const chainTime = useChainTime();
  const { isFetched } = useMarketDeadlineConstants();
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

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

  const handleResetForm = () => {
    if (reset) {
      setShowResetConfirmation(true);
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    console.log("submit");
  };

  return (
    <Transition
      show={Boolean(chainTime && isFetched)}
      enter="transition-opacity duration-100"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <h2 className="font-3xl text-center flex justify-center items-center gap-3">
        <span>Create Market</span>
      </h2>

      <div className="h-4 mb-8">
        <Transition
          show={Boolean(isTouched)}
          className={`flex center text-sm text-gray-400 font-medium `}
          enter="transition-opacity duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <button
            type="button"
            className="text-xs underline"
            onClick={handleResetForm}
          >
            clear form
          </button>
        </Transition>
      </div>

      <div className="flex center mb-6">
        <div className="mr-3 font-light">One Page</div>
        <Toggle
          checked={isWizard}
          onChange={setWizard}
          activeClassName="bg-green-400"
        />
        <div className="ml-3 font-light">Wizard</div>
      </div>

      <div className="mb-8 md:mb-12">
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
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="text-base flex justify-center items-center gap-2">
              Market Currency
              <InfoPopover title="Market Base Asset">
                <p className="text-gray-500 font-light text-sm">
                  The base asset used to provide liquidity to the market.
                </p>
              </InfoPopover>
            </h2>
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
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="mb-4 md:mb-8 text-base">What is your question?</h2>
            <div>
              <input
                className="h-12 w-full md:w-2/3 text-center bg-nyanza-base rounded-md mb-4 px-4 py-7"
                placeholder="When do I send it?"
                {...input("question", { type: "text" })}
              />
              <div className="flex center h-5 text-xs text-red-400">
                <ErrorMessage field={fieldsState.question} />
              </div>
            </div>
          </div>
          <h2 className="flex justify-center mb-4 md:mb-8 text-base text-center">
            <span className="hidden md:block">
              Which categories does the market relate to?
            </span>
            <span className="block md:hidden">Select market categories.</span>
          </h2>
          <div className="flex justify-center">
            <div className="mb-6 max-w-2xl">
              <CategorySelect {...input("tags")} />
            </div>
          </div>
          <div className="flex center h-5 text-xs text-red-400">
            <ErrorMessage field={fieldsState.tags} />
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Answers"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={!fieldsState.answers.isValid}
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="text-base">Answers</h2>
          </div>
          <AnswersInput {...input("answers", { mode: "onChange" })} />
          <div className="flex center h-5 text-xs text-red-400">
            <ErrorMessage field={fieldsState.answers} />
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Time Period"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={
            !fieldsState.endDate.isValid ||
            !fieldsState.gracePeriod.isValid ||
            !fieldsState.reportingPeriod.isValid ||
            !fieldsState.disputePeriod.isValid
          }
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="text-base">When does the market end?</h2>
          </div>
          <div className="mb-4">
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

          <div>
            <div className="mb-6">
              <div className="mb-4 text-center">
                <h2 className="flex text-base justify-center items-center gap-2">
                  Set Grace Period
                  <InfoPopover title="Grace Period">
                    <p className="text-gray-500 font-light text-sm">
                      Grace period starts after the market ends. During this
                      period, trading, reporting and disputing is disabled.
                    </p>
                  </InfoPopover>
                </h2>
              </div>
              <div className="flex justify-center">
                <BlockPeriodPicker
                  isValid={fieldsState.gracePeriod.isValid}
                  options={gracePeriodOptions}
                  chainTime={chainTime}
                  {...input("gracePeriod", { mode: "all" })}
                />
              </div>
              <div className="flex center h-5 mt-4 text-xs text-red-400">
                <ErrorMessage field={fieldsState.gracePeriod} />
              </div>
            </div>

            <div className="mb-6 ">
              <div className="mb-4 text-center">
                <h2 className="flex text-base justify-center items-center gap-2">
                  Set Report Period
                  <InfoPopover title="Report Period">
                    <p className="text-gray-500 font-light text-sm">
                      Reporting starts after the market ends and grace period
                      has finished. In this period the market outcome can only
                      be resolved by the designated oracle. If the oracle fails
                      to report the market goes into open reporting where anyone
                      can submit the outcome.
                    </p>
                  </InfoPopover>
                </h2>
              </div>
              <div className="flex justify-center">
                <BlockPeriodPicker
                  isValid={fieldsState.reportingPeriod.isValid}
                  options={reportingPeriodOptions}
                  chainTime={chainTime}
                  {...input("reportingPeriod", { mode: "all" })}
                />
              </div>
              <div className="flex center h-5 mt-4 text-xs text-red-400">
                <ErrorMessage field={fieldsState.reportingPeriod} />
              </div>
            </div>

            <div className="mb-0">
              <div className="mb-4 text-center">
                <h2 className="flex text-base justify-center items-center gap-2">
                  Set Dispute Period
                  <InfoPopover title="Report Period">
                    <p className="text-gray-500 font-light text-sm">
                      The dispute period starts when the market has been
                      reported. If no dispute is raised during this period the
                      market is resolved to the reported outcome.
                    </p>
                  </InfoPopover>
                </h2>
              </div>
              <div className="flex justify-center">
                <BlockPeriodPicker
                  isValid={fieldsState.disputePeriod.isValid}
                  options={disputePeriodOptions}
                  chainTime={chainTime}
                  {...input("disputePeriod", { mode: "all" })}
                />
              </div>
              <div className="flex center h-5 mt-4 text-xs text-red-400">
                <ErrorMessage field={fieldsState.disputePeriod} />
              </div>
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
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="mb-4 md:mb-8 text-base">Set Up Oracle</h2>
            <p className="mb-6 md:mb-12 text-sm text-gray-500 font-light">
              This is the account that will be{" "}
              <b className="font-semibold text-gray-600">
                responsible for submitting the outcome
              </b>{" "}
              when the market ends. <br /> If the Oracle fails to submit, you
              will lose some of your deposit.
            </p>
            <div>
              <input
                className="h-12 w-full md:w-2/3 text-center !bg-nyanza-base rounded-md mb-4 px-4 py-7 "
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
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="mb-4 md:mb-8 text-base">Market Description</h2>
            <div>
              <div className="flex center min-w-full">
                <QuillEditor
                  className="max-w-full w-full md:w-2/3 h-full mb-6 md:mb-0"
                  placeHolder={
                    "Additional information you want to provide about the market, such as resolution source, special cases, or other details."
                  }
                  {...input("description", { mode: "all" })}
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
          resetForm={isTouched && reset}
        >
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="mb-4 md:mb-8 text-base">Market Moderation</h2>
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
          isCurrent={currentStep.label == "Liquidity"}
          onClickNext={next}
          onClickBack={back}
          nextDisabled={!fieldsState.liquidity.isValid}
          resetForm={isTouched && reset}
        >
          <div className="mb-2 md:mb-4 text-center">
            <h2 className="text-base mb-0">Market Liquidity</h2>
          </div>

          <div>
            <LiquidityInput
              {...input("liquidity", { mode: "all" })}
              errorMessage={
                !fieldsState.answers.isValid
                  ? "Answers must be filled out correcty before adding liquidity"
                  : ""
              }
            />
          </div>
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Preview"}
          disabled={!isWizard}
          onClickBack={back}
          resetForm={isTouched && reset}
        >
          <div className="flex center mb-4 md:mb-8">
            <MarketPreview form={form} />
          </div>
        </MarketFormSection>

        <Modal
          open={showResetConfirmation}
          onClose={() => setShowResetConfirmation(false)}
        >
          <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-8 cursor-pointer">
            <div className="text-center mb-6">
              Are you sure you want to clear the form?
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="border-gray-300 text-sm  rounded-full py-3 px-6 transition-all ease-in-out duration-200 active:scale-95"
                onClick={() => {
                  setShowResetConfirmation(false);
                }}
              >
                cancel
              </button>
              <button
                type="button"
                className="border-gray-300 text-sm border-2 rounded-full py-3 px-6 transition-all ease-in-out duration-200 active:scale-95"
                onClick={() => {
                  reset();
                  setShowResetConfirmation(false);
                }}
              >
                clear
              </button>
            </div>
          </Dialog.Panel>
        </Modal>
      </form>
    </Transition>
  );
};

export default MarketCreationForm;
