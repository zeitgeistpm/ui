import { Transition, Disclosure } from "@headlessui/react";
import WizardStepper from "components/wizard/WizardStepper";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "lib/state/chaintime";
import {
  disputePeriodOptions,
  reportingPeriodOptions,
} from "lib/state/market-creation/constants/deadline-options";
import { useMarketDraftEditor } from "lib/state/market-creation/editor";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { LuFileWarning, LuChevronDown } from "react-icons/lu";
import { ErrorMessage } from "./ErrorMessage";
import Tooltip from "../../ui/Tooltip";
import { MarketFormSection } from "./MarketFormSection";
import { Publishing } from "./Publishing";
import { EditorResetButton } from "./ResetButton";
import MarketSummary from "./Summary";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import DateTimePicker from "./inputs/DateTime";
import { LiquidityInput } from "./inputs/Liquidity";
import ModerationModeSelect from "./inputs/Moderation";
import OracleInput from "./inputs/Oracle";
import { AnswersInput } from "./inputs/answers";
import { supportedCurrencies } from "lib/constants/supported-currencies";
import Input from "components/ui/Input";
import TimezoneSelect from "./inputs/TimezoneSelect";
import { Loader } from "components/ui/Loader";
import FeeSelect from "./inputs/FeeSelect";
import { useWallet } from "lib/state/wallet";
import { marketFormDataToExtrinsicParams } from "lib/state/market-creation/types/form";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/rpc";
import Toggle from "components/ui/Toggle";

const QuillEditor = dynamic(() => import("components/ui/QuillEditor"), {
  ssr: false,
});

export const MarketEditorCompact = () => {
  const wallet = useWallet();
  const editor = useMarketDraftEditor();

  const headerRef = useRef<HTMLDivElement>(null);

  const {
    form,
    steps,
    currentStep,
    setStep,
    isWizard,
    input,
    fieldsState,
    mergeFormData,
  } = editor;

  const chainTime = useChainTime();
  const { isFetched } = useMarketDeadlineConstants();
  const { data: constants } = useChainConstants();

  const timezone = form?.timeZone;

  const back = () => {
    const prevStep = prevStepFrom(steps, currentStep);
    if (prevStep) {
      setStep(prevStep);
    }
    headerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const next = () => {
    const nextStep = nextStepFrom(steps, currentStep);
    if (nextStep) {
      setStep(nextStep);
    }
    headerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePoolDeploymentToggle = (checked: boolean) => {
    mergeFormData({
      liquidity: {
        deploy: checked,
      },
    });
  };

  const showLiquidityWarning =
    fieldsState.liquidity.isTouched && form.liquidity?.deploy && isWizard;

  const isLoaded = Boolean(chainTime && isFetched);

  const signer = wallet.getSigner();
  const proxy = wallet.getProxyFor(wallet.activeAccount?.address);

  const creationParams =
    editor.isValid && chainTime && signer
      ? proxy && proxy.enabled
        ? marketFormDataToExtrinsicParams(
            editor.form,
            { address: wallet.realAddress } as KeyringPairOrExtSigner,
            chainTime,
            signer,
          )
        : marketFormDataToExtrinsicParams(editor.form, signer, chainTime)
      : undefined;

  return (
    <>
      {isLoaded === false && (
        <div
          className="flex items-center justify-center bg-white/80 backdrop-blur-md"
          style={{ height: "calc(100vh - 100px)" }}
        >
          <Loader
            loading={true}
            className="h-[100px] w-[100px]"
            variant={"Info"}
          />
        </div>
      )}
      <Transition
        show={isLoaded}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        {/* Mobile-Friendly Header with Title, Stepper, and Navigation */}
        <div
          ref={headerRef}
          className="sticky top-[52px] z-30 border-b border-sky-200/30 bg-white/95 px-4 py-3 backdrop-blur-lg md:px-12 md:py-2.5"
        >
          {/* Row 1: Title */}
          <div className="mb-2 flex items-center justify-between md:mb-0">
            <div className="flex items-center gap-2">
              <h1 className="whitespace-nowrap text-sm font-semibold text-sky-900 md:text-base">
                Create Market
              </h1>
              <EditorResetButton editor={editor} />
            </div>

            {/* Navigation buttons - Mobile: Right of title, Desktop: Below stepper */}
            {isWizard && (
              <div className="flex items-center gap-2 md:hidden">
                {prevStepFrom(steps, currentStep) && (
                  <button
                    className="rounded-full border border-sky-200/30 bg-white/80 px-3 py-1 text-xs text-sky-900 backdrop-blur-md transition-all hover:bg-sky-100/80 active:scale-95"
                    onClick={back}
                    type="button"
                  >
                    Back
                  </button>
                )}
                {nextStepFrom(steps, currentStep) && (
                  <button
                    disabled={
                      currentStep.label === "The Basics"
                        ? !fieldsState.question.isValid ||
                          !fieldsState.tags.isValid ||
                          !fieldsState.answers.isValid
                        : currentStep.label === "Timing & Resolution"
                          ? !fieldsState.endDate.isValid ||
                            !fieldsState.oracle.isValid ||
                            !fieldsState.gracePeriod.isValid ||
                            !fieldsState.reportingPeriod.isValid ||
                            !fieldsState.disputePeriod.isValid
                          : currentStep.label === "Economics & Deployment"
                            ? !fieldsState.currency.isValid ||
                              !fieldsState.creatorFee.isValid ||
                              !fieldsState.moderation.isValid ||
                              !fieldsState.liquidity.isValid ||
                              !fieldsState.answers.isValid
                            : false
                    }
                    className={`rounded-full border px-3 py-1 text-xs backdrop-blur-md transition-all ${
                      (currentStep.label === "The Basics" &&
                        (!fieldsState.question.isValid ||
                          !fieldsState.tags.isValid ||
                          !fieldsState.answers.isValid)) ||
                      (currentStep.label === "Timing & Resolution" &&
                        (!fieldsState.endDate.isValid ||
                          !fieldsState.oracle.isValid ||
                          !fieldsState.gracePeriod.isValid ||
                          !fieldsState.reportingPeriod.isValid ||
                          !fieldsState.disputePeriod.isValid)) ||
                      (currentStep.label === "Economics & Deployment" &&
                        (!fieldsState.currency.isValid ||
                          !fieldsState.creatorFee.isValid ||
                          !fieldsState.moderation.isValid ||
                          !fieldsState.liquidity.isValid ||
                          !fieldsState.answers.isValid))
                        ? "cursor-not-allowed border-sky-300/50 bg-sky-100/60 text-sky-600 opacity-80"
                        : "border-sky-600/50 bg-sky-600/90 text-white shadow-sm hover:bg-sky-600 active:scale-95"
                    }`}
                    type="button"
                    onClick={next}
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Stepper - Full width on mobile, integrated on desktop */}
          {isWizard && (
            <div className="md:flex md:items-center md:gap-6 py-2">
              <div className="flex-1">
                <WizardStepper
                  steps={steps}
                  current={currentStep}
                  onChange={(step) => setStep(step)}
                />
              </div>

              {/* Navigation buttons - Desktop only */}
              <div className="hidden items-center gap-2 md:flex">
                {prevStepFrom(steps, currentStep) && (
                  <button
                    className="rounded-full border border-sky-200/30 bg-white/80 px-4 py-1.5 text-xs text-sky-900 backdrop-blur-md transition-all hover:bg-sky-100/80 active:scale-95"
                    onClick={back}
                    type="button"
                  >
                    Back
                  </button>
                )}
                {nextStepFrom(steps, currentStep) && (
                  <button
                    disabled={
                      currentStep.label === "The Basics"
                        ? !fieldsState.question.isValid ||
                          !fieldsState.tags.isValid ||
                          !fieldsState.answers.isValid
                        : currentStep.label === "Timing & Resolution"
                          ? !fieldsState.endDate.isValid ||
                            !fieldsState.oracle.isValid ||
                            !fieldsState.gracePeriod.isValid ||
                            !fieldsState.reportingPeriod.isValid ||
                            !fieldsState.disputePeriod.isValid
                          : currentStep.label === "Economics & Deployment"
                            ? !fieldsState.currency.isValid ||
                              !fieldsState.creatorFee.isValid ||
                              !fieldsState.moderation.isValid ||
                              !fieldsState.liquidity.isValid ||
                              !fieldsState.answers.isValid
                            : false
                    }
                    className={`rounded-full border px-4 py-1.5 text-xs backdrop-blur-md transition-all ${
                      (currentStep.label === "The Basics" &&
                        (!fieldsState.question.isValid ||
                          !fieldsState.tags.isValid ||
                          !fieldsState.answers.isValid)) ||
                      (currentStep.label === "Timing & Resolution" &&
                        (!fieldsState.endDate.isValid ||
                          !fieldsState.oracle.isValid ||
                          !fieldsState.gracePeriod.isValid ||
                          !fieldsState.reportingPeriod.isValid ||
                          !fieldsState.disputePeriod.isValid)) ||
                      (currentStep.label === "Economics & Deployment" &&
                        (!fieldsState.currency.isValid ||
                          !fieldsState.creatorFee.isValid ||
                          !fieldsState.moderation.isValid ||
                          !fieldsState.liquidity.isValid ||
                          !fieldsState.answers.isValid))
                        ? "cursor-not-allowed border-sky-300/50 bg-sky-100/60 text-sky-600 opacity-80"
                        : "border-sky-600/50 bg-sky-600/90 text-white shadow-md hover:bg-sky-600 active:scale-95"
                    }`}
                    type="button"
                    onClick={next}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <form className="px-4 py-6 md:px-8">
          {/* STEP 1: THE BASICS */}
          <MarketFormSection
            wizard={isWizard}
            isCurrent={currentStep.label === "The Basics"}
            onClickNext={next}
            nextDisabled={
              !fieldsState.question.isValid ||
              !fieldsState.tags.isValid ||
              !fieldsState.answers.isValid
            }
          >
            <div className="space-y-6">
              {/* Question and Categories - Side by Side on Desktop */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* Question */}
                <div className="rounded-lg border border-sky-200/40 bg-gradient-to-br from-white/90 to-white/70 p-4 shadow-md backdrop-blur-md transition-all hover:shadow-lg">
                  <label className="mb-2 block text-sm font-semibold text-sky-900">
                    Market Question *
                  </label>
                  <Input
                    autoComplete="off"
                    className={`h-10 w-full rounded-md border px-3 text-sm shadow-sm backdrop-blur-md transition-all focus:shadow-md focus:ring-2 focus:ring-sky-400/20
                    ${
                      !fieldsState.question.isValid
                        ? "border-vermilion bg-sky-50/50"
                        : "border-sky-200/30 bg-white/80"
                    }`}
                    placeholder="Ask a specific question with a timeframe"
                    {...input("question", { type: "text" })}
                  />
                  <div className="mt-1 h-4 text-xs text-red-400">
                    <ErrorMessage field={fieldsState.question} />
                  </div>
                </div>

                {/* Categories */}
                <div className="rounded-lg border border-sky-200/40 bg-gradient-to-br from-white/90 to-white/70 p-4 shadow-md backdrop-blur-md transition-all hover:shadow-lg">
                  <label className="mb-2 block text-sm font-semibold text-sky-900">
                    Categories *
                  </label>
                  <CategorySelect {...input("tags")} />
                  <div className="mt-1 h-4 text-xs text-red-400">
                    <ErrorMessage field={fieldsState.tags} />
                  </div>
                </div>
              </div>

              {/* Answer Type - Full Width Card */}
              <div className="rounded-lg border border-sky-200/40 bg-gradient-to-br from-white/90 to-white/70 p-5 shadow-md backdrop-blur-md transition-all hover:shadow-lg">
                <label className="mb-3 flex items-center gap-1 text-sm font-semibold text-sky-900">
                  Answer Type *
                  <Tooltip content="Categorical: Multiple choice | Scalar: Number/date range | Yes/No: Binary" />
                </label>
                <AnswersInput
                  {...input("answers", { mode: "onChange" })}
                  fieldState={fieldsState.answers}
                />
                {showLiquidityWarning && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-orange-200/50 bg-orange-50/80 px-3 py-2 backdrop-blur-sm">
                    <LuFileWarning size={14} className="mt-0.5 flex-shrink-0 text-orange-600" />
                    <span className="text-xs leading-relaxed text-orange-900">
                      Changing answers will reset liquidity settings
                    </span>
                  </div>
                )}
                <div className="mt-1 h-4 text-xs text-red-400">
                  <ErrorMessage field={fieldsState.answers} />
                </div>
              </div>

              {/* Description - Collapsible Card */}
              <Disclosure>
                {({ open }) => (
                  <div className={`rounded-lg border border-sky-200/40 bg-gradient-to-br from-white/90 to-white/70 p-4 shadow-md backdrop-blur-md transition-all ${
                    open ? "shadow-lg" : "hover:shadow-lg"
                  }`}>
                    <Disclosure.Button className="flex w-full items-center justify-between text-left">
                      <span className="text-sm font-semibold text-sky-900">
                        Description{" "}
                        <span className="font-normal text-sky-700 opacity-75">
                          (Optional)
                        </span>
                      </span>
                      <LuChevronDown
                        className={`h-4 w-4 text-sky-900 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="mt-3">
                      <QuillEditor
                        className="h-12 w-full"
                        placeHolder="Add resolution source, special cases, or other details..."
                        {...input("description", { mode: "all" })}
                      />
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            </div>
          </MarketFormSection>

          {/* STEP 2: TIMING & RESOLUTION */}
          <MarketFormSection
            wizard={isWizard}
            isCurrent={currentStep.label === "Timing & Resolution"}
            onClickNext={next}
            onClickBack={back}
            nextDisabled={
              !fieldsState.endDate.isValid ||
              !fieldsState.oracle.isValid ||
              !fieldsState.gracePeriod.isValid ||
              !fieldsState.reportingPeriod.isValid ||
              !fieldsState.disputePeriod.isValid
            }
          >
            <div className="space-y-4">
              {/* Market End & Oracle - Single compact card */}
              <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Left: End Date & Timezone */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-sky-900">
                      Market End Date *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <DateTimePicker
                        timezone={timezone}
                        placeholder="Set End Date"
                        isValid={fieldsState.endDate.isValid}
                        {...input("endDate", { mode: "all" })}
                      />
                      <TimezoneSelect {...input("timeZone")} />
                    </div>
                    <div className="mt-1.5 h-4 text-xs text-red-400">
                      <ErrorMessage field={fieldsState.endDate} />
                    </div>
                  </div>

                  {/* Right: Oracle Account - Compact inline layout */}
                  <div>
                    <div className="flex items-start gap-1.5">
                      <label className="flex items-center gap-1 whitespace-nowrap pt-1.5 text-xs font-medium text-sky-900">
                        Oracle *
                        <Tooltip
                          content={`Account submits outcome. Bond: ${constants?.markets.oracleBond} ZTG`}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <OracleInput {...input("oracle", { mode: "all" })} />
                      </div>
                    </div>
                    <div className="mt-1 h-4 text-xs text-red-400">
                      <ErrorMessage field={fieldsState.oracle} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Periods - Two-column compact layout */}
              <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
                <h3 className="mb-3 text-sm font-semibold text-sky-900">
                  Resolution Periods
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Reporting Period */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-sky-900">
                      Reporting *
                      <Tooltip content="Time for oracle to submit the outcome after market ends" />
                    </label>
                    <BlockPeriodPicker
                      disabled={!fieldsState.endDate.isValid}
                      isValid={fieldsState.reportingPeriod.isValid}
                      options={reportingPeriodOptions}
                      chainTime={chainTime ?? undefined}
                      {...input("reportingPeriod", { mode: "all" })}
                    />
                    <div className="mt-1.5 h-4 text-xs text-red-400">
                      <ErrorMessage field={fieldsState.reportingPeriod} />
                    </div>
                  </div>

                  {/* Dispute Period */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-sky-900">
                      Dispute *
                      <Tooltip content="Time to dispute outcome before finalization" />
                    </label>
                    <BlockPeriodPicker
                      disabled={!fieldsState.endDate.isValid}
                      isValid={fieldsState.disputePeriod.isValid}
                      options={disputePeriodOptions}
                      chainTime={chainTime ?? undefined}
                      {...input("disputePeriod", { mode: "all" })}
                    />
                    <div className="mt-1.5 h-4 text-xs text-red-400">
                      <ErrorMessage field={fieldsState.disputePeriod} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MarketFormSection>

          {/* STEP 3: ECONOMICS & DEPLOYMENT */}
          <MarketFormSection
            wizard={isWizard}
            isCurrent={currentStep.label === "Economics & Deployment"}
            onClickNext={next}
            onClickBack={back}
            nextDisabled={
              !fieldsState.currency.isValid ||
              !fieldsState.creatorFee.isValid ||
              !fieldsState.moderation.isValid ||
              !fieldsState.liquidity.isValid ||
              !fieldsState.answers.isValid
            }
          >
            <div className="space-y-4">
              {/* Currency & Moderation Row */}
              <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Currency */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-sky-900">
                      Currency *
                    </label>
                    <CurrencySelect
                      options={supportedCurrencies.map(
                        (currency) => currency.name,
                      )}
                      {...input("currency")}
                    />
                    {showLiquidityWarning && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-orange-600">
                        <LuFileWarning size={12} className="mt-0.5 flex-shrink-0" />
                        <span>Resets liquidity</span>
                      </div>
                    )}
                  </div>

                  {/* Moderation */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-sky-900">
                      Moderation *
                    </label>
                    <ModerationModeSelect
                      {...input("moderation")}
                      onChange={(event) => {
                        mergeFormData({
                          liquidity: {
                            deploy:
                              event.target.value == "Advised"
                                ? false
                                : form.liquidity?.deploy,
                          },
                          moderation: event.target.value,
                        });
                      }}
                    />
                    <div className="mt-1 h-4 text-xs text-red-400">
                      <ErrorMessage field={fieldsState.moderation} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advised warning */}
              {form.moderation === "Advised" && (
                <div className="flex items-start gap-2 rounded-md border border-orange-200/50 bg-orange-50/80 px-3 py-2.5 backdrop-blur-sm">
                  <LuFileWarning
                    size={16}
                    className="mt-0.5 flex-shrink-0 text-orange-600"
                  />
                  <p className="text-xs leading-relaxed text-orange-900">
                    <span className="font-semibold">Requires approval.</span>{" "}
                    {constants?.markets.advisoryBondSlashPercentage}% slash if
                    rejected. Add liquidity after approval.
                  </p>
                </div>
              )}

              {/* Deploy Pool Section (includes Creator Fee) */}
              {form.moderation === "Permissionless" && form.currency && (
                <div className="rounded-md border border-sky-200/30 bg-white/80 p-3 backdrop-blur-md">
                  <div className="mb-2.5 flex items-center justify-between">
                    <label className="flex items-center gap-1 text-xs font-semibold text-sky-900">
                      Deploy Pool
                      <Tooltip content="Deploy liquidity pool on market creation" />
                    </label>
                    <Toggle
                      checked={form?.liquidity?.deploy ?? false}
                      activeClassName="bg-sky-600"
                      onChange={handlePoolDeploymentToggle}
                    />
                  </div>

                  {/* Creator Fee - Always visible */}
                  <div className="mb-2.5">
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-sky-900">
                      Creator Fee *
                      <Tooltip content="Fee earned from trading volume" />
                    </label>
                    <FeeSelect
                      {...input("creatorFee", { mode: "all" })}
                      label="% Fee"
                      presets={[
                        { value: 0, type: "preset" },
                        { value: 0.1, type: "preset" },
                        { value: 0.5, type: "preset" },
                      ]}
                      isValid={fieldsState.creatorFee?.isValid}
                    />
                    <div className="mt-1 h-4 text-xs text-red-400">
                      <ErrorMessage field={fieldsState.creatorFee} />
                    </div>
                  </div>

                  {/* Liquidity inputs - only if deploy is true */}
                  {form?.liquidity?.deploy ? (
                    <div className="border-t border-sky-200/30 pt-2.5">
                      {!fieldsState.answers.isValid ? (
                        <div className="text-xs text-red-500">
                          Complete answers first
                        </div>
                      ) : (
                        <LiquidityInput
                          {...input("liquidity", { mode: "all" })}
                          currency={form.currency}
                          errorMessage={
                            !fieldsState.answers.isValid
                              ? "Complete answers first"
                              : ""
                          }
                        />
                      )}
                      <div className="mt-1 h-4 text-xs text-red-400">
                        <ErrorMessage field={fieldsState.liquidity} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-md border border-sky-200/30 bg-sky-50/50 px-3 py-2 backdrop-blur-sm">
                      <p className="text-xs leading-relaxed text-sky-700">
                        💡 Pool can be deployed later from market page
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Creator Fee for Advised mode */}
              {form.moderation === "Advised" && form.currency && (
                <div className="rounded-md border border-sky-200/30 bg-white/80 p-3 backdrop-blur-md">
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-sky-900">
                    Creator Fee *
                    <Tooltip content="Fee earned from trading volume" />
                  </label>
                  <FeeSelect
                    {...input("creatorFee", { mode: "all" })}
                    label="% Fee"
                    presets={[
                      { value: 0, type: "preset" },
                      { value: 0.1, type: "preset" },
                      { value: 0.5, type: "preset" },
                    ]}
                    isValid={fieldsState.creatorFee?.isValid}
                  />
                  <div className="mt-1 h-4 text-xs text-red-400">
                    <ErrorMessage field={fieldsState.creatorFee} />
                  </div>
                </div>
              )}
            </div>
          </MarketFormSection>

          {/* STEP 4: REVIEW & PUBLISH */}
          <MarketFormSection
            wizard={isWizard}
            isCurrent={currentStep.label === "Review & Publish"}
            disabled={!isWizard}
          >
            <MarketSummary creationParams={creationParams} editor={editor} />
          </MarketFormSection>

          {(!editor.isWizard || currentStep.label === "Review & Publish") && (
            <Publishing creationParams={creationParams} editor={editor} />
          )}
        </form>
      </Transition>
    </>
  );
};

export default MarketEditorCompact;
