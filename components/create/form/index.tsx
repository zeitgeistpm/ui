import { Dialog, Transition } from "@headlessui/react";
import Modal from "components/ui/Modal";
import Toggle from "components/ui/Toggle";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { useMarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "lib/state/chaintime";
import {
  disputePeriodOptions,
  gracePeriodOptions,
  reportingPeriodOptions,
} from "lib/state/market-creation/constants/deadline-options";
import { useMarketDraftEditor } from "lib/state/market-creation/editor";
import dynamic from "next/dynamic";
import { FormEventHandler, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { BsEraser } from "react-icons/bs";
import { LuFileWarning } from "react-icons/lu";
import { ErrorMessage } from "./ErrorMessage";
import InfoPopover from "./InfoPopover";
import { MarketFormSection } from "./MarketFormSection";
import MarketPreview from "./Preview";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import DateTimePicker from "./inputs/DateTime";
import { LiquidityInput } from "./inputs/Liquidity";
import ModerationModeSelect from "./inputs/Moderation";
import { AnswersInput } from "./inputs/answers";
import { useAtom } from "jotai";
import * as MarketDraft from "lib/state/market-creation/types/draft";
import { persistentAtom } from "lib/state/util/persistent-atom";
import OracleInput from "./inputs/Oracle";

const QuillEditor = dynamic(() => import("components/ui/QuillEditor"), {
  ssr: false,
});

const createMarketStateAtom = persistentAtom<MarketDraft.MarketDraftState>({
  key: "market-creation-form",
  defaultValue: MarketDraft.empty(),
  migrations: [
    /**
     * TODO: remove before merging to staging.
     */
    () => MarketDraft.empty(),
    () => MarketDraft.empty(),
    () => MarketDraft.empty(),
    () => MarketDraft.empty(),
    () => MarketDraft.empty(),
  ],
});

export const MarketCreationForm = () => {
  const [state, setState] = useAtom(createMarketStateAtom);

  const {
    form,
    steps,
    currentStep,
    setStep,
    goToSection,
    isWizard,
    toggleWizard,
    input,
    fieldsState,
    mergeFormData,
    isTouched,
    isValid,
    reset,
  } = useMarketDraftEditor({ state, setState });

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

  const showLiquidityWarning =
    fieldsState.liquidity.isTouched && form.liquidity?.deploy && isWizard;

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
      <h2 className="relative font-3xl text-center flex justify-center items-center gap-3 mb-6">
        <div className="relative md:flex justify-center items-center">
          Create Market
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
              className="text-xs center gap-1 rounded-md border-1 py-1 px-2 md:absolute md:right-0 md:translate-x-[125%] md:translate-y-[-50%] md:top-[50%]"
              onClick={handleResetForm}
            >
              clear form
              <BsEraser />
            </button>
          </Transition>
        </div>
      </h2>

      <div className="flex center mb-8">
        <div className="mr-3 font-light">One Page</div>
        <Toggle checked={isWizard} onChange={toggleWizard} />
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
              <InfoPopover
                title={
                  <h3 className="flex justify-center items-center mb-4 gap-2">
                    <AiOutlineInfoCircle />
                    Market Base Asset
                  </h3>
                }
              >
                <p className="text-gray-500 font-light text-sm">
                  The base asset used to provide liquidity to the market and
                  what you use when making trades for market outcome tokens.
                </p>
              </InfoPopover>
            </h2>
          </div>
          <CurrencySelect options={["ZTG", "DOT"]} {...input("currency")} />
          {showLiquidityWarning && (
            <div className="center mt-4 mb-8">
              <div className="w-full md:max-w-lg text-center text-sm text-gray-400">
                <LuFileWarning size={22} className="inline mr-2" />
                You have already added liquidity to this market. If you change
                the base currency liquidity settings will be reset to defaults.
              </div>
            </div>
          )}
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
                autoComplete="off"
                className={`h-12 w-full md:w-2/3 text-center rounded-md mb-4 px-4 py-7
                  ${
                    !fieldsState.question.isValid
                      ? "bg-gray-100"
                      : "bg-nyanza-base "
                  }
                `}
                placeholder="Ask a question that is specific and has a timeframe."
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
          <div className="relative mb-4 md:mb-8 text-center">
            <h2 className="text-base center gap-2">
              Answers
              <InfoPopover
                title={<h4 className="answer-types mb-4">Answer Types</h4>}
                className="!text-left"
              >
                <h4 className="text-base text-left mb-1">
                  Options (Categorical)
                </h4>
                <p className="text-gray-500 font-light text-sm text-left mb-4">
                  Options will create a categorical market from the options you
                  specify.{" "}
                  <a
                    className="text-ztg-blue"
                    href="https://docs.zeitgeist.pm/docs/learn/prediction-markets#categorical-prediction-markets"
                    target="_blank"
                  >
                    Learn more.
                  </a>
                </p>
                <h4 className="text-base text-left mb-1">Scalar</h4>
                <p className="text-gray-500 font-light text-sm text-left mb-4">
                  A scalar market is a market where the outcome is a number in a
                  the range specified by the lower(<b>short</b>) and upper(
                  <b>long</b>) bound.{" "}
                  <a
                    className="text-ztg-blue"
                    href="https://docs.zeitgeist.pm/docs/learn/prediction-markets#scalar-prediction-markets"
                    target="_blank"
                  >
                    Learn more.
                  </a>
                </p>
                <h4 className="text-base text-left mb-1">Yes/No</h4>
                <p className="text-gray-500 font-light text-sm text-left">
                  Choosing yes/no will create a categorical market with two
                  preset outcomes, yes and no.
                </p>
              </InfoPopover>
            </h2>
          </div>
          <AnswersInput
            {...input("answers", { mode: "onChange" })}
            fieldState={fieldsState.answers}
          />
          {showLiquidityWarning && (
            <div className="mt-8 mb-4">
              <div className="center">
                <div className="w-full md:max-w-xl text-center text-sm text-gray-400">
                  <LuFileWarning size={22} className="inline mr-2" />
                  You have already added liquidity to this market. If you change
                  the number of answers the liquidity settings will be reset to
                  defaults.
                </div>
              </div>
            </div>
          )}
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
                  <InfoPopover
                    title={
                      <h3 className="flex justify-center items-center mb-4 gap-2">
                        <AiOutlineInfoCircle />
                        Grace Period
                      </h3>
                    }
                  >
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
                  <InfoPopover
                    title={
                      <h3 className="flex justify-center items-center mb-4 gap-2">
                        <AiOutlineInfoCircle />
                        Report Period
                      </h3>
                    }
                  >
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
                  <InfoPopover
                    title={
                      <h3 className="flex justify-center items-center mb-4 gap-2">
                        <AiOutlineInfoCircle />
                        Dispute Period
                      </h3>
                    }
                  >
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
          nextDisabled={!fieldsState.oracle.isValid}
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
              <div className="center mb-6">
                <OracleInput
                  className="md:w-2/3"
                  {...input("oracle", { mode: "all" })}
                />
              </div>
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
          nextDisabled={
            !fieldsState.liquidity.isValid || !fieldsState.answers.isValid
          }
          resetForm={isTouched && reset}
        >
          {form.moderation === "Permissionless" ? (
            <>
              <div className="mb-2 md:mb-4 text-center">
                <h2 className="text-base mb-0">Market Liquidity</h2>
              </div>

              <div className="mb-6">
                <LiquidityInput
                  {...input("liquidity", { mode: "all" })}
                  currency={form.currency}
                  errorMessage={
                    !fieldsState.answers.isValid
                      ? "Answers must be filled out correctly before adding liquidity."
                      : ""
                  }
                />
                <div className="flex center h-5 text-xs mt-6 text-red-400">
                  <ErrorMessage field={fieldsState.liquidity} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-4">
                <div className="mb-2 center text-gray-500">
                  <LuFileWarning size={22} />
                </div>
                <div className="center mb-12">
                  <div className="text-center text-lg md:max-w-xl text-gray-500">
                    You have selected <b>advised</b> moderation. This means that
                    the market could be rejected by the moderators. If the
                    market is rejected, you will be refunded part of your bonded
                    deposit{" "}
                    <i>
                      (minus a slash percentage depending on chain
                      configuration)
                    </i>
                    .
                    <br />
                    <br />
                    If the market is <b>approved</b>, you will be able to{" "}
                    <b>add liquidity </b>
                    or request it from the community.
                  </div>
                </div>
              </div>
            </>
          )}
        </MarketFormSection>

        <MarketFormSection
          wizard={isWizard}
          isCurrent={currentStep.label == "Summary"}
          disabled={!isWizard}
          onClickBack={back}
          resetForm={isTouched && reset}
        >
          <div className="flex center mb-4 md:mb-8">
            <MarketPreview
              form={form}
              goToSection={goToSection}
              mergeFormData={mergeFormData}
            />
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
