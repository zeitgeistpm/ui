import { useWindowSize } from "lib/hooks/useWindowSize";
import { clamp } from "lodash-es";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import medianRange from "median-range";

export type WizardStepData<T extends string> = { label: T };

export type WizardStepperProps<
  T extends string,
  S extends WizardStepData<T>[],
> = {
  steps: S;
  current: WizardStepData<T>;
  onChange?: (step: WizardStepData<T>) => void;
};

function WizardStepper<T extends string, S extends WizardStepData<T>[]>({
  current,
  steps,
  onChange,
}: WizardStepperProps<T, S>) {
  const stepIndex = steps.findIndex((s) => s.label === current.label);
  const progress = (stepIndex / (steps.length - 1)) * 100;

  return (
    <div
      className={`flex relative justify-center transition-transform md:!transform-none`}
    >
      <div className="flex relative center">
        <div
          className={`absolute -z-10 transiton-all ease-in-out duration-300 bg-black left-[calc(0px+theme(space.12))] top-4 w-[calc(100%-theme(space.24))]`}
          style={{
            height: "1px",
            transform: `scaleX(${progress.toFixed()}%)`,
            transformOrigin: "left",
          }}
        />
        <div
          className={`absolute -z-20 transiton-all ease-in-out duration-300 bg-gray-200 left-[calc(0px+theme(space.12))] top-4 w-[calc(100%-theme(space.24))]`}
          style={{
            height: "1px",
            transform: `scaleX(100%)`,
            transformOrigin: "left",
          }}
        />

        {steps.map((step, index) => {
          return (
            <div
              key={index}
              className={`w-24 cursor-pointer transition-all group`}
              onClick={() => onChange(step)}
            >
              <div className="flex center mb-2">
                <div
                  className={`flex center h-8 w-8  rounded-full text-white text-sm duration-200 ease-in-out group-active:scale-[1.1]
                  ${stepIndex >= index ? "bg-black" : "bg-gray-400"}
                `}
                >
                  {index + 1}
                </div>
              </div>
              <div
                className={`flex center py-2 ${
                  current === step ? "font-bold" : "font-light"
                } ${stepIndex >= index ? "text-black" : "text-gray-400"}`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WizardStepper;
