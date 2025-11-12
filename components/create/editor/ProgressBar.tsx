import { WizardStep } from "components/wizard/types";

export type ProgressBarProps<T extends WizardStep<any>> = {
  steps: T[];
  current: T;
};

export const ProgressBar = <T extends WizardStep<any>>({
  steps,
  current,
}: ProgressBarProps<T>) => {
  const currentStepIndex = steps.findIndex((s) => s.label === current.label);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const stepNumber = currentStepIndex + 1;
  const totalSteps = steps.length;

  return (
    <div className="inline-block w-full">
      <div className="relative h-8 w-full overflow-hidden rounded-lg bg-white/10 shadow-md backdrop-blur-sm sm:h-10">
        <div
          className="h-full rounded-lg bg-gradient-to-r from-ztg-primary-300/85 to-ztg-primary-200/95 transition-all"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2.5 sm:px-4">
          <div className="flex flex-wrap items-center gap-1 text-xs sm:gap-1.5 sm:text-sm">
            <span className="font-bold text-white">
              Step {stepNumber} of {totalSteps}:
            </span>
            <span className="font-medium text-white/80">{current.label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="font-bold text-white">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
