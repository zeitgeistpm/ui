import { useWindowSize } from "lib/hooks/useWindowSize";
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

  const visibleStepRange = medianrange(
    currentStepIndex,
    isMobile ? 3 : steps.length,
    0,
    steps.length - 1,
  );

  const visibleSteps: T[] = visibleStepRange.map((index) => steps[index]);
  const visibleStepIndex = visibleSteps.findIndex(
    (s) => s.label === current.label,
  );

  const progress = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div
      className={`flex relative justify-center transition-transform md:!transform-none`}
    >
      <div className="flex relative center ">
        <div
          className={`absolute -z-10 transiton-all ease-in-out duration-300 bg-black left-[calc(0px+theme(space.12))] top-4 w-[calc(100%-theme(space.24))]`}
          style={{
            height: "1px",
            transform: `scaleX(${progress.toFixed()}%)`,
            transformOrigin: "left",
          }}
        />
        <div
          className={`absolute -z-20 transition-all ease-in-out duration-300 bg-gray-200 left-[calc(0px+theme(space.12))] top-4 w-[calc(100%-theme(space.24))]`}
          style={{
            height: "1px",
            transform: `scaleX(100%)`,
            transformOrigin: "left",
          }}
        />

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
              className={`w-24 ${
                canNavigate ? "cursor-pointer" : "cursor-not-allowed"
              } transition-all group`}
              disabled={!canNavigate}
              onClick={() => onChange(step)}
            >
              <div className="flex center mb-2">
                <div
                  className={`relative flex center h-8 w-8  rounded-full text-white text-sm duration-200 ease-in-out group-active:scale-95
                  bg-gray-500
                  ${(canNavigate || index === visibleStepIndex) && "!bg-black"}
                  ${showError && "bg-red-500"}
                  ${showCompleted && "bg-green-400"}
                  ${
                    index === visibleStepIndex &&
                    "ring-2 ring-blue-400 md:ring-0"
                  }
                `}
                >
                  <div
                    className={`absolute h-full w-full bg-red-500 rounded-full transition-all ease-[cubic-bezier(.51,.44,.4,1.65)] duration-300 ${
                      showError ? "scale-75" : "scale-0"
                    }`}
                  ></div>
                  <div className="z-30">{stepIndex}</div>
                </div>
              </div>
              <div
                className={`flex center py-2 ${
                  currentStepIndex >= index ? "text-black" : "text-gray-400"
                } ${index === visibleStepIndex && "font-bold md:font-normal"}`}
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