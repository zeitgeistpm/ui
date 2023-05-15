import { usePrevious } from "lib/hooks/usePrevious";
import { isEqual } from "lodash-es";
import { useEffect } from "react";
import { DeepPartial, UseFormReturn, useForm } from "react-hook-form";

export type MarketFormSectionProps<T> = {
  wizard?: boolean;
  render: (form: UseFormReturn<T, any>) => JSX.Element;
  onComplete: (data: T) => void;
  onClickBack?: () => void;
};

export type BaseMarketFormSectionProps<T> = {
  render: (form: UseFormReturn<T, any>) => JSX.Element;
  onComplete: (data: T) => void;
  onClickBack?: () => void;
};

export function MarketFormSection<T>({
  wizard,
  render,
  onComplete,
  onClickBack,
}: MarketFormSectionProps<T>) {
  const internalForm = useForm<T>({});

  const onSubmit = (data: T) => {
    console.log(`Section.submit`, data);
    onComplete?.(data);
  };

  const section = render(internalForm);

  if (wizard) {
    return (
      <form onSubmit={internalForm.handleSubmit(onSubmit)}>
        <div className="mb-16">{section}</div>
        <div className="flex center">
          {onClickBack && (
            <button
              className="border-gray-300 text-sm border-2 rounded-full py-4 px-8 mr-4"
              onClick={onClickBack}
            >
              Go Back
            </button>
          )}

          <button
            className="border-gray-300 text-sm border-2 rounded-full py-4 px-8"
            type="submit"
          >
            Next
          </button>
        </div>
      </form>
    );
  }

  return section;
}
