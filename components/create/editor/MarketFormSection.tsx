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
      className={`mb-12 rounded-ztg-12 border border-sky-200/30 bg-white/80 p-6 shadow-lg backdrop-blur-md md:p-8 ${
        isCurrent || !wizard ? "block" : "hidden"
      } ${className}`}
    >
      {disabled ? <></> : children}
    </div>
  );
};
