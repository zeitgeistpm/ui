import { useWindowSize } from "lib/hooks/events/useWindowSize";
import { WizardStep, nextStepFrom, prevStepFrom } from "./types";
import medianrange from "median-range";
import { TAILWIND } from "lib/constants";

export type WizardStepperProps<T extends WizardStep<any>> = {
  steps: T[];
  current: T;
  onChange?: (step: T) => void;
};

export const WizardStepper = <T extends WizardStep<any>>({
  steps,
  current,
  onChange,
}: WizardStepperProps<T>) => {
  const currentStepIndex = steps.findIndex((s) => s.label === current.label);

  const { width } = useWindowSize();
  const isMobile = width < parseInt(TAILWIND.theme.screens.md.replace("px"));

  // Calculate visible steps, ensuring we don't request more steps than available
  // If we have 4 or fewer steps, just show all of them even on mobile
  const shouldShowAllSteps = steps.length <= 4;

  let visibleSteps: T[];
  let visibleStepIndex: number;

  if (shouldShowAllSteps || !isMobile) {
    // Show all steps when we have 4 or fewer, or on desktop
    visibleSteps = steps;
    visibleStepIndex = currentStepIndex;
  } else {
    // On mobile with more than 4 steps, use medianrange
    const visibleStepRange = medianrange(
      currentStepIndex,
      3,
      0,
      steps.length - 1,
    );
    visibleSteps = visibleStepRange.map((index) => steps[index]);
    visibleStepIndex = visibleSteps.findIndex((s) => s.label === current.label);
  }
  const progress = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="relative flex w-full items-center">
      {/* Progress bar background */}
      <div className="absolute left-0 right-0 top-[10px] -z-20 h-[2px] bg-ztg-primary-300/60" />
      {/* Progress bar fill */}
      <div
        className="absolute left-0 top-[10px] -z-10 h-[2px] bg-ztg-primary-600 transition-all duration-300 ease-in-out"
        style={{
          width: `${progress}%`,
        }}
      />

      {/* Steps - evenly distributed */}
      <div className="flex w-full items-start justify-between">
        {visibleSteps.map((step, index) => {
          const prevStep = prevStepFrom(steps, step);

          const canNavigate =
            step?.reached ||
            (step.isTouched && step.isValid) ||
            (index < currentStepIndex && prevStep?.isValid) ||
            (prevStep?.isValid && index === currentStepIndex + 1);

          const showCompleted = step?.reached && step?.isValid;
          const showError =
            index !== currentStepIndex && step?.reached && !step?.isValid;

          const stepIndex =
            steps.findIndex((s, index) => s.label === step.label) + 1;

          return (
            <button
              key={index}
              className={`flex flex-1 flex-col items-center ${
                canNavigate ? "cursor-pointer" : "cursor-not-allowed"
              } group transition-all`}
              disabled={!canNavigate}
              onClick={() => onChange?.(step)}
            >
              <div className="center mb-1 flex">
                <div
                  className={`center relative flex h-5 w-5 rounded-full text-xs font-semibold duration-200 ease-in-out
                  group-active:scale-95
                  ${
                    canNavigate || index === visibleStepIndex
                      ? "bg-ztg-primary-600 text-white"
                      : "bg-ztg-primary-300/60 text-ztg-primary-700"
                  }
                  ${showError && "bg-red-500 text-white"}
                  ${showCompleted && "bg-emerald-500 text-white"}
                  ${
                    index === visibleStepIndex &&
                    "ring-2 ring-ztg-primary-400 ring-offset-1"
                  }
                `}
                >
                  <div
                    className={`absolute h-full w-full rounded-full bg-red-500 transition-all duration-300 ease-[cubic-bezier(.51,.44,.4,1.65)] ${
                      showError ? "scale-75" : "scale-0"
                    }`}
                  ></div>
                  <div className="z-30">{stepIndex}</div>
                </div>
              </div>
              <div
                className={`center hidden text-center text-[10px] leading-tight md:flex ${
                  currentStepIndex >= index
                    ? "font-medium text-ztg-primary-900"
                    : "text-ztg-primary-700"
                } ${index === visibleStepIndex && "font-semibold"}`}
              >
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardStepper;
