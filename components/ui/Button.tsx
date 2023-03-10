import { observer } from "mobx-react";
import { FC, PropsWithChildren } from "react";

const Button: FC<
  PropsWithChildren<{
    className?: string;
    onClick?: () => void;
  }>
> = observer(({ className = "", onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-md focus:outline-none px-2 py-2 ${className}`}
    >
      {children}
    </button>
  );
});

export default Button;
