import { PropsWithChildren, FC } from "react";

const SecondaryButton: FC<
  PropsWithChildren<{
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  }>
> = ({ onClick, disabled, className = "", children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`line-clamp-1 w-full rounded-full border-2 border-gray-300 px-5 py-1 text-xxs hover:border-gray-400 disabled:opacity-50 md:py-1.5 md:text-xs ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
