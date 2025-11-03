import { Transition, Disclosure } from "@headlessui/react";
import { nextStepFrom, prevStepFrom } from "components/wizard/types";
import momentTz from "moment-timezone";
import ProgressBar from "./ProgressBar";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarketDeadlineConstants } from "lib/hooks/queries/useMarketDeadlineConstants";
import { useChainTime } from "lib/state/chaintime";
import {
  disputePeriodOptions,
  reportingPeriodOptions,
} from "lib/state/market-creation/constants/deadline-options";
import { useMarketDraftEditor } from "lib/state/market-creation/editor";
import dynamic from "next/dynamic";
import { useRef, useMemo } from "react";
import { LuFileWarning, LuChevronDown } from "react-icons/lu";
import { ErrorMessage } from "./ErrorMessage";
import Tooltip from "../../ui/Tooltip";
import { MarketFormSection } from "./MarketFormSection";
import { Publishing } from "./Publishing";
import MarketSummary from "./Summary";
import CostCalculator from "./CostCalculator";
import BlockPeriodPicker from "./inputs/BlockPeriod";
import CategorySelect from "./inputs/Category";
import CurrencySelect from "./inputs/Currency";
import DateTimePicker from "./inputs/DateTime";
import { LiquidityUnified } from "./inputs/LiquidityUnified";
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
import { blocksAsDuration } from "lib/state/market-creation/types/form";
import { timelineAsBlocks } from "lib/state/market-creation/types/timeline";
import { shortenAddress } from "lib/util";

const QuillEditor = dynamic(() => import("components/ui/QuillEditor"), {
  ssr: false,
});

const QuillViewer = dynamic(() => import("components/ui/QuillViewer"), {
  ssr: false,
});

export const MarketEditorCompact = () => {
  const wallet = useWallet();
  const editor = useMarketDraftEditor();

  const headerRef = useRef<HTMLDivElement>(null);
  const publishingRef = useRef<HTMLDivElement>(null);

  const {
    form,
    steps,
    currentStep,
    setStep,
    input,
    fieldsState,
    mergeFormData,
  } = editor;

  const chainTime = useChainTime();
  const { isFetched } = useMarketDeadlineConstants();
  const { data: constants } = useChainConstants();

  const timezone = form?.timeZone;

  const timeline = useMemo(() => {
    return !form || !chainTime
      ? null
      : timelineAsBlocks(form, chainTime).unwrap();
  }, [form, chainTime]);

  const back = () => {
    const prevStep = prevStepFrom(steps, currentStep);
    if (prevStep) {
      setStep(prevStep);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const nextStep = nextStepFrom(steps, currentStep);
    if (nextStep) {
      setStep(nextStep);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePoolDeploymentToggle = (checked: boolean) => {
    mergeFormData({
      liquidity: {
        deploy: checked,
      },
    });
  };

  const showLiquidityWarning =
    fieldsState.liquidity.isTouched && form.liquidity?.deploy;

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
          className="flex items-center justify-center bg-white/10 backdrop-blur-md"
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
        {/* Header with Progress Bar and Navigation */}
        <div
          ref={headerRef}
          className="sticky top-[52px] z-30 backdrop-blur-lg"
        >
          <div>
            <div className="py-2">
              <div className="flex items-center gap-4 rounded-lg bg-white/10 p-3 backdrop-blur-md md:p-4">
                <div className="flex flex-1 items-center">
                  <ProgressBar steps={steps} current={currentStep} />
                </div>

                {/* Navigation buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  {prevStepFrom(steps, currentStep) && (
                    <button
                      className="h-8 rounded-lg bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20 active:scale-95 sm:h-10 sm:px-5 sm:text-sm"
                      onClick={back}
                      type="button"
                    >
                      Back
                    </button>
                  )}
                  {nextStepFrom(steps, currentStep) && (
                    <button
                      disabled={
                        currentStep.label === "Question & Answers"
                          ? !fieldsState.question.isValid ||
                            !fieldsState.tags.isValid ||
                            !fieldsState.answers.isValid
                          : currentStep.label === "Timeline & Resolution"
                            ? !fieldsState.endDate.isValid ||
                              !fieldsState.oracle.isValid ||
                              !fieldsState.gracePeriod.isValid ||
                              !fieldsState.reportingPeriod.isValid ||
                              !fieldsState.disputePeriod.isValid
                            : currentStep.label === "Pricing & Options"
                              ? !fieldsState.currency.isValid ||
                                !fieldsState.creatorFee.isValid ||
                                !fieldsState.moderation.isValid ||
                                !fieldsState.liquidity.isValid ||
                                !fieldsState.answers.isValid
                              : false
                      }
                      className={`h-8 rounded-lg border-2 px-4 text-xs font-semibold backdrop-blur-sm transition-all active:scale-95 sm:h-10 sm:px-5 sm:text-sm ${
                        (currentStep.label === "Question & Answers" &&
                          (!fieldsState.question.isValid ||
                            !fieldsState.tags.isValid ||
                            !fieldsState.answers.isValid)) ||
                        (currentStep.label === "Timeline & Resolution" &&
                          (!fieldsState.endDate.isValid ||
                            !fieldsState.oracle.isValid ||
                            !fieldsState.gracePeriod.isValid ||
                            !fieldsState.reportingPeriod.isValid ||
                            !fieldsState.disputePeriod.isValid)) ||
                        (currentStep.label === "Pricing & Options" &&
                          (!fieldsState.currency.isValid ||
                            !fieldsState.creatorFee.isValid ||
                            !fieldsState.moderation.isValid ||
                            !fieldsState.liquidity.isValid ||
                            !fieldsState.answers.isValid))
                          ? "cursor-not-allowed border-white/20 bg-white/5 text-white/40"
                          : "border-ztg-green-600/80 bg-ztg-green-600/90 text-white shadow-md hover:border-ztg-green-500 hover:bg-ztg-green-600"
                      }`}
                      type="button"
                      onClick={next}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <form className="py-6 pb-32">
            {/* STEP 1: QUESTION & ANSWERS */}
            <MarketFormSection
              isCurrent={currentStep.label === "Question & Answers"}
              onClickNext={next}
              nextDisabled={
                !fieldsState.question.isValid ||
                !fieldsState.answers.isValid ||
                !fieldsState.tags.isValid
              }
            >
              <div className="space-y-6">
                {/* Step Header with Description */}
                <div className="mb-4">
                  <h2 className="mb-1 text-lg font-bold text-white md:text-xl">
                    Start with Your Question
                  </h2>
                  <p className="text-sm text-white/70">
                    Create a clear, specific question that can be definitively
                    answered
                  </p>
                </div>

                {/* Market Question - Card */}
                <div
                  className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                    !fieldsState.question.isValid &&
                    fieldsState.question.isTouched
                      ? "border-ztg-red-500/60"
                      : fieldsState.question.isValid &&
                          fieldsState.question.isTouched
                        ? "border-ztg-green-500/80"
                        : "border-transparent"
                  }`}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-white">
                    Market Question <span className="text-ztg-red-400">*</span>
                    <Tooltip content="Make it specific with a clear timeframe and resolution criteria. Example: 'Will Bitcoin reach $100k by Dec 31, 2024?'" />
                  </label>
                  <Input
                    autoComplete="off"
                    className="h-12 w-full rounded-lg border-2 border-white/20 bg-white/10 px-4 text-sm text-white backdrop-blur-sm transition-all placeholder:text-white/50 hover:border-white/30"
                    placeholder="e.g., Will Bitcoin reach $100k by Dec 31, 2024?"
                    {...input("question", { type: "text" })}
                  />
                  {!fieldsState.question.isValid &&
                    fieldsState.question.isTouched && (
                      <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                        <LuFileWarning size={14} className="mt-0.5 shrink-0" />
                        <ErrorMessage field={fieldsState.question} />
                      </div>
                    )}
                </div>

                {/* Answer Options + Categories - Side by Side */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Answer Options - Card */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      !fieldsState.answers.isValid &&
                      fieldsState.answers.isTouched
                        ? "border-ztg-red-500/60"
                        : fieldsState.answers.isValid &&
                            fieldsState.answers.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Outcome Selection{" "}
                      <span className="text-ztg-red-400">*</span>
                      <Tooltip content="Categorical: Multiple choice options | Scalar: Number or date range | Yes/No: Simple binary question" />
                    </label>
                    <AnswersInput
                      {...input("answers", { mode: "onChange" })}
                      fieldState={fieldsState.answers}
                    />
                    {!fieldsState.answers.isValid &&
                      fieldsState.answers.isTouched && (
                        <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                          <LuFileWarning
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <ErrorMessage field={fieldsState.answers} />
                        </div>
                      )}
                  </div>

                  {/* Categories - Card */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      !fieldsState.tags.isValid && fieldsState.tags.isTouched
                        ? "border-ztg-red-500/60"
                        : fieldsState.tags.isValid && fieldsState.tags.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Categories <span className="text-ztg-red-400">*</span>
                      <Tooltip content="Select one or more categories to help traders find your market" />
                    </label>
                    <CategorySelect {...input("tags")} />
                    {!fieldsState.tags.isValid &&
                      fieldsState.tags.isTouched && (
                        <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                          <LuFileWarning
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <ErrorMessage field={fieldsState.tags} />
                        </div>
                      )}
                  </div>
                </div>

                {/* Description - Collapsible */}
                <Disclosure>
                  {({ open }) => (
                    <div className="rounded-lg bg-white/10 backdrop-blur-sm">
                      <Disclosure.Button className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5">
                        <span className="text-sm font-semibold text-white">
                          Description{" "}
                          <span className="font-normal text-white/60">
                            (Optional)
                          </span>
                        </span>
                        <LuChevronDown
                          className={`h-4 w-4 text-white transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className=" px-4 pb-4 pt-3">
                        <QuillEditor
                          className="min-h-[120px] w-full rounded-lg bg-white/5"
                          placeHolder="Add resolution source, special cases, or other details..."
                          {...input("description", { mode: "all" })}
                        />
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              </div>
            </MarketFormSection>

            {/* STEP 2: TIMELINE & RESOLUTION */}
            <MarketFormSection
              isCurrent={currentStep.label === "Timeline & Resolution"}
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
              <div className="space-y-6">
                {/* Step Header */}
                <div className="mb-4">
                  <h2 className="mb-1 text-lg font-bold text-white md:text-xl">
                    Set the Timeline
                  </h2>
                  <p className="text-sm text-white/70">
                    Define when the market ends and how outcomes are determined
                  </p>
                </div>

                {/* Row: Market End Date (1 col) + Resolution Timeline (2 cols) */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Market End Date - 1 Column */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      !fieldsState.endDate.isValid &&
                      fieldsState.endDate.isTouched
                        ? "border-ztg-red-500/60"
                        : fieldsState.endDate.isValid &&
                            fieldsState.endDate.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Market End Date{" "}
                      <span className="text-ztg-red-400">*</span>
                      <Tooltip content="When trading stops and the market closes. Oracle must report outcome after this date." />
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="w-full">
                        <DateTimePicker
                          className="w-full"
                          timezone={timezone}
                          placeholder="Select end date and time"
                          isValid={fieldsState.endDate.isValid}
                          hasValue={!!form?.endDate}
                          {...input("endDate", { mode: "all" })}
                        />
                      </div>
                      <div className="w-full">
                        <TimezoneSelect
                          {...input("timeZone")}
                          hasValue={!!form?.timeZone}
                        />
                      </div>
                    </div>
                    {!fieldsState.endDate.isValid &&
                      fieldsState.endDate.isTouched && (
                        <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                          <LuFileWarning
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <ErrorMessage field={fieldsState.endDate} />
                        </div>
                      )}
                  </div>

                  {/* Resolution Timeline - 2 Columns */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all lg:col-span-2 ${
                      (!fieldsState.reportingPeriod.isValid &&
                        fieldsState.reportingPeriod.isTouched) ||
                      (!fieldsState.disputePeriod.isValid &&
                        fieldsState.disputePeriod.isTouched)
                        ? "border-ztg-red-500/60"
                        : fieldsState.reportingPeriod.isValid &&
                            fieldsState.reportingPeriod.isTouched &&
                            fieldsState.disputePeriod.isValid &&
                            fieldsState.disputePeriod.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-white">
                        Resolution Timeline
                      </h3>
                      <p className="mt-1 text-xs text-white/70">
                        How long after the market ends for reporting and
                        disputes
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Reporting Period */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-white">
                          Reporting Window{" "}
                          <span className="text-ztg-red-400">*</span>
                          <Tooltip content="How long the oracle has to submit the outcome after the market ends. Recommended: 1-2 weeks for most markets." />
                        </label>
                        <BlockPeriodPicker
                          disabled={!fieldsState.endDate.isValid}
                          isValid={fieldsState.reportingPeriod.isValid}
                          options={reportingPeriodOptions}
                          chainTime={chainTime ?? undefined}
                          {...input("reportingPeriod", { mode: "all" })}
                        />
                        {!fieldsState.reportingPeriod.isValid &&
                          fieldsState.reportingPeriod.isTouched && (
                            <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                              <LuFileWarning
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              <ErrorMessage
                                field={fieldsState.reportingPeriod}
                              />
                            </div>
                          )}
                        {fieldsState.endDate.isValid &&
                          !fieldsState.reportingPeriod.isTouched && (
                            <p className="text-xs text-white/60">
                              💡 Tip: Give your oracle enough time to gather
                              data and report accurately
                            </p>
                          )}
                      </div>

                      {/* Dispute Period */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-white">
                          Dispute Window{" "}
                          <span className="text-ztg-red-400">*</span>
                          <Tooltip content="How long outcomes can be disputed before finalization. Recommended: 3-7 days to allow for corrections." />
                        </label>
                        <BlockPeriodPicker
                          disabled={!fieldsState.endDate.isValid}
                          isValid={fieldsState.disputePeriod.isValid}
                          options={disputePeriodOptions}
                          chainTime={chainTime ?? undefined}
                          {...input("disputePeriod", { mode: "all" })}
                        />
                        {!fieldsState.disputePeriod.isValid &&
                          fieldsState.disputePeriod.isTouched && (
                            <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                              <LuFileWarning
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              <ErrorMessage field={fieldsState.disputePeriod} />
                            </div>
                          )}
                        {fieldsState.endDate.isValid &&
                          !fieldsState.disputePeriod.isTouched && (
                            <p className="text-xs text-white/60">
                              💡 Tip: A dispute period protects against
                              incorrect outcomes
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Oracle Account - Full Width Card */}
                <div
                  className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                    !fieldsState.oracle.isValid && fieldsState.oracle.isTouched
                      ? "border-ztg-red-500/60"
                      : fieldsState.oracle.isValid &&
                          fieldsState.oracle.isTouched
                        ? "border-ztg-green-500/80"
                        : "border-transparent"
                  }`}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-white">
                    Oracle Account <span className="text-ztg-red-400">*</span>
                    <Tooltip
                      content={`This account will report the market outcome. Requires ${constants?.markets.oracleBond} ZTG bond (returned if reported on time).`}
                    />
                  </label>
                  <OracleInput {...input("oracle", { mode: "all" })} />
                  {!fieldsState.oracle.isValid &&
                    fieldsState.oracle.isTouched && (
                      <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                        <LuFileWarning size={14} className="mt-0.5 shrink-0" />
                        <ErrorMessage field={fieldsState.oracle} />
                      </div>
                    )}
                  {wallet.realAddress && !form.oracle && (
                    <p className="text-xs text-white/60">
                      💡 Tip: Click "Use connected" to quickly set your account
                      as the oracle
                    </p>
                  )}
                </div>
              </div>
            </MarketFormSection>

            {/* STEP 3: PRICING & OPTIONS */}
            <MarketFormSection
              isCurrent={currentStep.label === "Pricing & Options"}
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
              <div className="space-y-6">
                {/* Step Header */}
                <div className="mb-4">
                  <h2 className="mb-1 text-lg font-bold text-white md:text-xl">
                    Configure Pricing
                  </h2>
                  <p className="text-sm text-white/70">
                    Set fees, currency, and optional liquidity pool
                  </p>
                </div>

                {/* Currency, Market Type & Creator Fee - One Row */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Currency */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      !fieldsState.currency.isValid &&
                      fieldsState.currency.isTouched
                        ? "border-ztg-red-500/60"
                        : fieldsState.currency.isValid &&
                            fieldsState.currency.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Currency <span className="text-ztg-red-400">*</span>
                      <Tooltip content="The token used for trading in this market" />
                    </label>
                    <CurrencySelect
                      options={supportedCurrencies.map(
                        (currency) => currency.name,
                      )}
                      {...input("currency")}
                    />
                    {!fieldsState.currency.isValid &&
                      fieldsState.currency.isTouched && (
                        <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                          <LuFileWarning
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <ErrorMessage field={fieldsState.currency} />
                        </div>
                      )}
                  </div>

                  {/* Market Type */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      !fieldsState.moderation.isValid &&
                      fieldsState.moderation.isTouched
                        ? "border-ztg-red-500/60"
                        : fieldsState.moderation.isValid &&
                            fieldsState.moderation.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Market Type <span className="text-ztg-red-400">*</span>
                      <Tooltip content="Permissionless: Goes live immediately | Advised: Requires committee approval" />
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
                    {!fieldsState.moderation.isValid &&
                      fieldsState.moderation.isTouched && (
                        <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                          <LuFileWarning
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <ErrorMessage field={fieldsState.moderation} />
                        </div>
                      )}
                  </div>

                  {/* Creator Fee */}
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      !fieldsState.creatorFee.isValid &&
                      fieldsState.creatorFee.isTouched
                        ? "border-ztg-red-500/60"
                        : fieldsState.creatorFee.isValid &&
                            fieldsState.creatorFee.isTouched
                          ? "border-ztg-green-500/80"
                          : "border-transparent"
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Creator Fee <span className="text-ztg-red-400">*</span>
                      <Tooltip content="Percentage fee you earn from all trading volume. Set to 0% if you don't want fees." />
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
                    {!fieldsState.creatorFee.isValid &&
                      fieldsState.creatorFee.isTouched && (
                        <div className="flex items-start gap-1.5 text-xs text-ztg-red-400">
                          <LuFileWarning
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <ErrorMessage field={fieldsState.creatorFee} />
                        </div>
                      )}
                  </div>
                </div>

                {/* Advised warning */}
                {form.moderation === "Advised" && (
                  <div className="flex items-start gap-3 rounded-lg border-2 border-orange-500/60 bg-orange-500/10 px-4 py-3 backdrop-blur-sm">
                    <LuFileWarning
                      size={18}
                      className="mt-0.5 shrink-0 text-orange-400"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        Requires Approval
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/90">
                        {constants?.markets.advisoryBondSlashPercentage}% slash
                        if rejected. Add liquidity after approval.
                      </p>
                    </div>
                  </div>
                )}

                {/* Liquidity Pool Section - Clearly Optional */}
                {form.currency && form.moderation === "Permissionless" && (
                  <div
                    className={`space-y-3 rounded-lg border-2 bg-white/5 p-4 transition-all ${
                      form?.liquidity?.deploy
                        ? (!fieldsState.liquidity.isValid ||
                            !fieldsState.answers.isValid) &&
                          fieldsState.liquidity.isTouched
                          ? "border-ztg-red-500/60"
                          : fieldsState.liquidity.isValid &&
                              fieldsState.answers.isValid &&
                              fieldsState.liquidity.isTouched
                            ? "border-ztg-green-500/80"
                            : "border-transparent"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-white">
                            Liquidity Pool
                            <Tooltip content="Add initial liquidity to enable immediate trading. You can add this later if you skip now." />
                          </label>
                          <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                            Optional
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/70">
                          Provide initial liquidity to make your market
                          immediately tradeable
                        </p>
                      </div>
                      <Toggle
                        checked={form?.liquidity?.deploy ?? false}
                        activeClassName="bg-ztg-green-600"
                        onChange={handlePoolDeploymentToggle}
                      />
                    </div>

                    {/* Liquidity inputs - only if deploy is true */}
                    {form?.liquidity?.deploy && (
                      <div className=" pt-4">
                        {!fieldsState.answers.isValid ? (
                          <div className="flex items-center gap-2 rounded-lg border-2 border-ztg-red-500/60 bg-ztg-red-500/10 px-3 py-2.5 text-sm text-ztg-red-400">
                            <LuFileWarning size={16} className="shrink-0" />
                            <span>
                              Complete answer options first to set up liquidity
                            </span>
                          </div>
                        ) : (
                          <LiquidityUnified
                            value={form.liquidity}
                            answers={form.answers!}
                            currency={form.currency}
                            onChange={(liquidity) => {
                              mergeFormData({ liquidity });
                            }}
                            input={input("liquidity", { mode: "all" })}
                            fieldsState={fieldsState.liquidity}
                          />
                        )}
                        {!fieldsState.liquidity.isValid &&
                          fieldsState.liquidity.isTouched && (
                            <div className="mt-3 flex items-start gap-1.5 text-xs text-ztg-red-400">
                              <LuFileWarning
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              <ErrorMessage field={fieldsState.liquidity} />
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* Skip Liquidity Message - When Toggle is Off */}
                {form.currency &&
                  form.moderation === "Permissionless" &&
                  !form?.liquidity?.deploy && (
                    <div className="flex items-start gap-2.5 rounded-lg bg-white/5 p-4">
                      <span className="text-lg">💡</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          Liquidity can be added later
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-white/70">
                          Your market will be created but won't be tradeable
                          until liquidity is added. You can add it from the
                          market page after creation.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </MarketFormSection>

            {/* STEP 4: REVIEW & LAUNCH */}
            <MarketFormSection
              isCurrent={currentStep.label === "Review & Launch"}
              disabled={false}
            >
              <div className="space-y-6">
                {/* Step Header */}
                <div className="mb-4">
                  <h2 className="mb-1 text-lg font-bold text-white md:text-xl">
                    Review & Launch
                  </h2>
                  <p className="text-sm text-white/70">
                    Review all details before publishing to the blockchain
                  </p>
                </div>

                {/* Compact Summary Grid */}
                <div className="space-y-4">
                  {/* Question */}
                  <div className="space-y-3 rounded-lg bg-white/5 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Market Question
                    </label>
                    <p className="text-sm font-medium text-white">
                      {form?.question || (
                        <span className="text-orange-400">
                          No question given
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Answers - Compact Grid */}
                  {form.answers && (
                    <div className="space-y-3 rounded-lg bg-white/5 p-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        Answer Options
                        {form.answers.type === "categorical" &&
                          ` (${form.answers.answers.length})`}
                        {form.answers.type === "scalar" && " (Scalar)"}
                        {form.answers.type === "yes/no" && " (Yes/No)"}
                      </label>
                      {form.answers.type === "categorical" && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {(form.answers.answers as string[]).map(
                            (answer, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-white/5 px-3 py-2"
                              >
                                <div className="text-xs font-medium uppercase text-white/70">
                                  {answer}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                      {form.answers.type === "scalar" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-white/5 px-3 py-2">
                            <div className="text-xs text-white/70">
                              Short (Lower)
                            </div>
                            <div className="text-xs font-medium text-white">
                              {(form.answers.answers as number[])[0]}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/5 px-3 py-2">
                            <div className="text-xs text-white/70">
                              Long (Upper)
                            </div>
                            <div className="text-xs font-medium text-white">
                              {(form.answers.answers as number[])[1]}
                            </div>
                          </div>
                        </div>
                      )}
                      {form.answers.type === "yes/no" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border-2 border-white/20 bg-white/5 px-3 py-2">
                            <div className="text-xs font-medium uppercase text-white">
                              Yes
                            </div>
                          </div>
                          <div className="rounded-lg border-2 border-white/20 bg-white/5 px-3 py-2">
                            <div className="text-xs font-medium uppercase text-white">
                              No
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing & Settings - Grid Layout */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Currency & Moderation */}
                    <div className="space-y-3 rounded-lg bg-white/5 p-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        Currency & Type
                      </label>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Currency:</span>
                          <span className="font-medium text-white">
                            {form.currency || "--"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Type:</span>
                          <span className="font-medium text-white">
                            {form.moderation || "--"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Creator Fee:</span>
                          <span className="font-medium text-white">
                            {form.creatorFee?.value || "0"}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline - Compact */}
                    <div className="space-y-3 rounded-lg bg-white/5 p-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        Timeline
                      </label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">End Date:</span>
                          <span className="font-medium text-white">
                            {form.endDate
                              ? momentTz
                                  .tz(form.endDate, form.timeZone || "UTC")
                                  .format("MMM D, YYYY h:mm A")
                              : "--"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Reporting:</span>
                          <span className="font-medium text-white">
                            {timeline?.report?.period
                              ? blocksAsDuration(
                                  timeline.report.period,
                                ).humanize()
                              : "--"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70">Dispute:</span>
                          <span className="font-medium text-white">
                            {timeline?.dispute?.period
                              ? blocksAsDuration(
                                  timeline.dispute.period,
                                ).humanize()
                              : "--"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Oracle & Liquidity - Grid */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Oracle */}
                    <div className="space-y-3 rounded-lg bg-white/5 p-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        Oracle Account
                      </label>
                      <p className="font-mono text-xs font-medium text-white">
                        {form?.oracle
                          ? shortenAddress(form.oracle, 8, 8)
                          : "--"}
                      </p>
                    </div>

                    {/* Liquidity Status */}
                    <div className="space-y-3 rounded-lg bg-white/5 p-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        Liquidity Pool
                      </label>
                      {form?.liquidity?.deploy &&
                      form?.moderation === "Permissionless" ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Amount:</span>
                            <span className="font-medium text-white">
                              {form.liquidity.amount} {form.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Swap Fee:</span>
                            <span className="font-medium text-white">
                              {form.liquidity.swapFee?.value || "--"}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-orange-400">
                          {form?.moderation === "Advised"
                            ? "Will be available after approval"
                            : "No liquidity - can be added later"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description - Collapsible */}
                  {form?.description && (
                    <Disclosure>
                      {({ open }) => (
                        <div className="rounded-lg bg-white/5 backdrop-blur-sm">
                          <Disclosure.Button className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5">
                            <span className="text-sm font-semibold text-white">
                              Description{" "}
                              <span className="font-normal text-white/60">
                                (Click to view)
                              </span>
                            </span>
                            <LuChevronDown
                              className={`h-4 w-4 text-white transition-transform ${
                                open ? "rotate-180" : ""
                              }`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pb-4 pt-2">
                            <div className="prose prose-sm max-w-none text-xs text-white/90">
                              <QuillViewer value={form.description || ""} />
                            </div>
                          </Disclosure.Panel>
                        </div>
                      )}
                    </Disclosure>
                  )}

                  {/* Publishing Section - Integrated */}
                  <Publishing
                    creationParams={creationParams}
                    editor={editor}
                    compact={true}
                  />
                </div>
              </div>
            </MarketFormSection>
          </form>
        </div>

        {/* Always-Visible Cost Calculator - Sticky Bottom Bar */}
        {isLoaded && (
          <CostCalculator
            editor={editor}
            creationParams={creationParams}
            compact={true}
          />
        )}
      </Transition>
    </>
  );
};

export default MarketEditorCompact;
