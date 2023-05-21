export type WizardStep<T> = T extends any
  ? {
      label: T;
      isValid: boolean;
      isTouched: boolean;
      reached: boolean;
    }
  : never;

export const nextStepFrom = <T extends string>(
  steps: WizardStep<T>[],
  step: WizardStep<T>,
): WizardStep<T> => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps[index];
};

export const prevStepFrom = <T extends string>(
  steps: WizardStep<T>[],
  step: WizardStep<T>,
): WizardStep<T> => {
  const index = steps.findIndex((s) => s.label === step.label) - 1;
  return steps[index];
};

export const nextInvalidStepFrom = <T extends string>(
  steps: WizardStep<T>[],
  step: WizardStep<T>,
): WizardStep<T> => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps.slice(index).find((s) => !s.isValid);
};
