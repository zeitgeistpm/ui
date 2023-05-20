import { Transition } from "@headlessui/react";
import { FieldState } from "lib/state/market-creation/types/field-state";

/**
 * Displayes a error message when a field has an error and
 * has been touched by the user.
 *
 * @param props.field - the field to display the error message for.
 */
export const ErrorMessage = ({ field }: { field: FieldState }) => {
  return (
    <Transition
      show={Boolean(field.errors && field.isTouched)}
      enter="transition-opacity duration-250"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-250"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <span>{field?.errors?.[0]}</span>
    </Transition>
  );
};
