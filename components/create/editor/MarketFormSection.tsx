import React from "react";

export type MarketFormSectionProps = {
  isCurrent: boolean;
  onClickNext?: () => void;
  onClickBack?: () => void;
  nextDisabled?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export const MarketFormSection = ({
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
      className={`mb-8 rounded-lg bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all md:mb-10 md:p-8 ${
        isCurrent ? "block" : "hidden"
      } ${className}`}
    >
      {disabled ? <></> : children}
    </div>
  );
};
