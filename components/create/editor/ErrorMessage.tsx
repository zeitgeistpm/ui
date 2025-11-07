import { Transition } from "@headlessui/react";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { AlertCircle } from "react-feather";

/**
 * Displays an error message when a field has an error and
 * has been touched by the user.
 *
 * @param props.field - the field to display the error message for.
 */
export const ErrorMessage = ({ field }: { field: FieldState }) => {
  const errorMessage = field?.errors?.[0]?.message;

  // Add helpful context to common errors
  const enhancedMessage = errorMessage
    ? errorMessage.includes("Required")
      ? `${errorMessage} This field cannot be left empty.`
      : errorMessage.includes("Invalid")
        ? `${errorMessage} Please check your input and try again.`
        : errorMessage.includes("minimum")
          ? `${errorMessage} Increase the value to meet the requirement.`
          : errorMessage.includes("maximum")
            ? `${errorMessage} Decrease the value to meet the requirement.`
            : errorMessage.includes("must be greater")
              ? `${errorMessage} Try increasing the value.`
              : errorMessage.includes("must be less")
                ? `${errorMessage} Try decreasing the value.`
                : errorMessage
    : "Please fix this error to continue.";

  return (
    <Transition
      show={Boolean(field.errors && field.isTouched)}
      enter="transition-all duration-250"
      enterFrom="opacity-0 -translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-250"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-1"
    >
      <div className="mt-1.5 flex items-start gap-2 rounded-md border border-ztg-red-500/40 bg-ztg-red-900/20 px-3 py-2 backdrop-blur-sm">
        <AlertCircle
          className="mt-0.5 shrink-0 text-ztg-red-400"
          size={16}
          strokeWidth={2}
        />
        <span className="text-sm leading-relaxed text-ztg-red-300">
          {enhancedMessage}
        </span>
      </div>
    </Transition>
  );
};
