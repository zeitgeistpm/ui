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
      className={`w-full rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
