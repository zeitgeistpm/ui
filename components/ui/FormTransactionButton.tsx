import { FC, PropsWithChildren } from "react";
import TransactionButton from "./TransactionButton";

interface TransactionButtonProps {
  disabled?: boolean;
  className?: string;
  dataTest?: string;
  disableFeeCheck?: boolean;
  type?: "button" | "submit" | "reset";
  loading: boolean | undefined;
  variant?: "green" | "red";
}

const FormTransactionButton: FC<PropsWithChildren<TransactionButtonProps>> = ({
  disabled = false,
  className = "",
  dataTest = "",
  disableFeeCheck = false,
  type = "submit",
  children,
  loading = undefined,
  variant = "green",
}) => {
  return (
    <TransactionButton
      type={type}
      disabled={disabled}
      className={className}
      dataTest={dataTest}
      disableFeeCheck={disableFeeCheck}
      loading={loading}
      variant={variant}
    >
      {children}
    </TransactionButton>
  );
};

export default FormTransactionButton;
