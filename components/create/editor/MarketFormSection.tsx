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
          <div className="flex center mb-6 gap-4">
            {onClickBack && (
              <button
                className={`border-gray-300 text-sm border-2 rounded-full py-4 px-8 ease-in-out active:scale-95 duration-200 `}
                onClick={onClickBack}
                type="button"
              >
                Go Back
              </button>
            )}
            {onClickNext && (
              <button
                disabled={nextDisabled}
                className={`border-gray-300 text-sm border-2 rounded-full py-4 px-8 transition-all ease-in-out duration-200 ${
                  nextDisabled && "cursor-not-allowed opacity-70 text-gray-500"
                }
                ${
                  !nextDisabled &&
                  "active:scale-95 bg-nyanza-base border-nyanza-base"
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
