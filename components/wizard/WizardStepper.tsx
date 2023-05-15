export type WizardStepData<T extends string> = { label: T };

export type WizardStepperProps<
  T extends string,
  S extends WizardStepData<T>[],
> = {
  steps: S;
  step: WizardStepData<T>;
  onChange?: (step: WizardStepData<T>) => void;
};

function WizardStepper<T extends string, S extends WizardStepData<T>[]>({
  step,
  steps,
  onChange,
}: WizardStepperProps<T, S>) {
  const stepIndex = steps.findIndex((s) => s.label === step.label);
  const progress = (stepIndex / (steps.length - 1)) * 100;

  return (
    <div className="flex relative center">
      <div className="flex relative center">
        <div
          className={`absolute -z-10 transiton-all ease-in-out duration-300 bg-black left-[calc(0px+theme(space.12))] top-4 w-[calc(100%-theme(space.24))]`}
          style={{
            height: "1px",
            transform: `scaleX(${progress.toFixed()}%)`,
            transformOrigin: "left",
          }}
        />

        {steps.map((step, index) => {
          return (
            <div
              className="w-24 cursor-pointer transition-all group"
              onClick={() => onChange(step)}
            >
              <div className="flex center mb-2">
                <div className="flex center h-8 w-8 bg-black rounded-full text-white text-sm duration-200 ease-in-out group-active:scale-110">
                  {index + 1}
                </div>
              </div>
              <div className="flex center">{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WizardStepper;
