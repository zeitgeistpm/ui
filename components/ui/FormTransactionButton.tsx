import { FC, PropsWithChildren } from "react";
import TransactionButton from "./TransactionButton";

interface TransactionButtonProps {
  disabled?: boolean;
  className?: string;
  dataTest?: string;
}

const FormTransactionButton: FC<PropsWithChildren<TransactionButtonProps>> = ({
  disabled = false,
  className = "",
  dataTest = "",
  children,
}) => {
  return (
    <TransactionButton
      type="submit"
      disabled={disabled}
      className={className}
      dataTest={dataTest}
    >
      {children}
    </TransactionButton>
  );
};

export default FormTransactionButton;
