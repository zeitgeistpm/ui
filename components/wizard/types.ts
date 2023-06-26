/**
 * Describes a step or section in a given wizard flow.
 * Creates a constant tuple type over a union type with ordering intact.
 */
export type WizardStep<T> = T extends any
  ? {
      /**
       * Label for the step.
       * Used for its distinct type and also the label in the ui.
       */
      label: T;
      /**
       * True only if all the inputs in the step/section are valid.
       */
      isValid: boolean;
      /**
       * True if one or more of the inputs in the step has been touched
       * by the user.
       */
      isTouched: boolean;
      /**
       * True if the step has been reached by the user.
       * The step should be able to be navigated to if it has been reached in the
       * current editing session.
       */
      reached: boolean;
    }
  : never;

/**
 * Get the next step if any, after a given step.
 */
export const nextStepFrom = <T extends string>(
  steps: WizardStep<T>[],
  step: WizardStep<T>,
): WizardStep<T> => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps[index];
};

/**
 * Get the previous step if any, after a given step.
 */
export const prevStepFrom = <T extends string>(
  steps: WizardStep<T>[],
  step: WizardStep<T>,
): WizardStep<T> => {
  const index = steps.findIndex((s) => s.label === step.label) - 1;
  return steps[index];
};

/**
 * Get the first step that is invalid, if any, after a given step.
 * Used for going to the first invalid step when wizard mode is toggled on or of.
 */
export const nextInvalidStepFrom = <T extends string>(
  steps: WizardStep<T>[],
  step: WizardStep<T>,
): WizardStep<T> => {
  const index = steps.findIndex((s) => s.label === step.label) + 1;
  return steps.slice(index).find((s) => !s.isValid) ?? step;
};
