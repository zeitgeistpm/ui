import { FC, PropsWithChildren } from "react";
import TransactionButton from "./TransactionButton";

interface TransactionButtonProps {
  disabled?: boolean;
  className?: string;
  dataTest?: string;
  disableFeeCheck?: boolean;
}

const FormTransactionButton: FC<PropsWithChildren<TransactionButtonProps>> = ({
  disabled = false,
  className = "",
  dataTest = "",
  disableFeeCheck = false,
  children,
}) => {
  return (
    <TransactionButton
      type="submit"
      disabled={disabled}
      className={className}
      dataTest={dataTest}
      disableFeeCheck={disableFeeCheck}
    >
      {children}
    </TransactionButton>
  );
};

export default FormTransactionButton;
