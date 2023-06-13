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
      className={`border-gray-300 text-xs border-2 rounded-full px-5 py-1.5 line-clamp-1 disabled:opacity-50 w-full ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
