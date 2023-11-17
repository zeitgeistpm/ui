import React from "react";

export type MarketFormSectionProps = {
  wizard?: boolean;
  isCurrent: boolean;
  onClickNext?: () => void;
  onClickBack?: () => void;
  nextDisabled?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export const MarketFormSection = ({
  wizard,
  isCurrent,
  children,
  onClickNext,
  onClickBack,
  nextDisabled,
  disabled,
  className,
}: MarketFormSectionProps) => {
  return (
    <div
      className={`mb-16 ${
        isCurrent || !wizard ? "block" : "hidden"
      } ${className}`}
    >
      {disabled ? (
        <></>
      ) : !wizard ? (
        children
      ) : (
        <>
          <div className="mb-6 md:mb-4">{children}</div>
          <div className="center mb-6 flex gap-4">
            {onClickBack && (
              <button
                className={`rounded-full border-2 border-gray-300 px-8 py-4 text-sm duration-200 ease-in-out active:scale-95 `}
                onClick={onClickBack}
                type="button"
              >
                Go Back
              </button>
            )}
            {onClickNext && (
              <button
                disabled={nextDisabled}
                className={`rounded-full border-2 border-gray-300 px-8 py-4 text-sm transition-all duration-200 ease-in-out ${
                  nextDisabled && "cursor-not-allowed text-gray-500 opacity-70"
                }
                ${
                  !nextDisabled &&
                  "border-nyanza-base bg-nyanza-base active:scale-95"
                }`}
                type="button"
                onClick={onClickNext}
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
