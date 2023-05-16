import React, { ReactNode } from "react";

export type MarketFormSectionProps<T> = {
  wizard?: boolean;
  onClickNext?: () => void;
  onClickBack?: () => void;
  nextDisabled?: boolean;
  children: React.ReactNode;
};

export const MarketFormSection = function <T>({
  wizard,
  children,
  onClickNext,
  onClickBack,
  nextDisabled,
}: MarketFormSectionProps<T>) {
  return (
    <>
      {!wizard ? (
        children
      ) : (
        <>
          <div className="mb-16">{children}</div>
          <div className="flex center">
            {onClickBack && (
              <button
                className={`border-gray-300 text-sm border-2 rounded-full py-4 px-8 mr-4 `}
                onClick={onClickBack}
              >
                Go Back
              </button>
            )}
            {onClickNext && (
              <button
                disabled={nextDisabled}
                className={`border-gray-300 text-sm border-2 rounded-full py-4 px-8 transition-all ${
                  nextDisabled && "cursor-not-allowed opacity-70 text-gray-500"
                }`}
                type="submit"
                onClick={onClickNext}
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};
