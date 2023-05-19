export type WizardStepData<T extends string> = {
  label: T;
  isValid: boolean;
  isTouched: boolean;
  reached: boolean;
};

export const nextStepFrom = <T extends string>(
  steps: WizardStepData<T>[],
  step: WizardStepData<T>,
): WizardStepData<T> => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps[index];
};

export const prevStepFrom = <T extends string>(
  steps: WizardStepData<T>[],
  step: WizardStepData<T>,
): WizardStepData<T> => {
  const index = steps.findIndex((s) => s.label === step.label) - 1;
  return steps[index];
};

export const nextInvalidStepFrom = <T extends string>(
  steps: WizardStepData<T>[],
  step: WizardStepData<T>,
): WizardStepData<T> => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps.slice(index).find((s) => !s.isValid);
};
