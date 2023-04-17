import { observer } from "mobx-react";
import { FC, PropsWithChildren } from "react";
import { useStore } from "lib/stores/Store";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useAccountModals } from "lib/hooks/account";

interface TransactionButtonProps {
  disabled?: boolean;
  className?: string;
  dataTest?: string;
}

const FormTransactionButton: FC<PropsWithChildren<TransactionButtonProps>> =
  observer(({ disabled = false, className = "", dataTest = "", children }) => {
    const store = useStore();
    const { wallets } = store;
    const { connected } = wallets;
    const accountModals = useAccountModals();
    const { locationAllowed, isUsingVPN } = useUserLocation();

    const click = (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (!connected) {
        event.preventDefault();
        accountModals.openWalletSelect();
      }
    };

    const isDisabled = () => {
      if (locationAllowed !== true || isUsingVPN || !store?.sdk?.api) {
        return true;
      } else if (!connected) {
        return false;
      }
      return disabled;
    };

    return (
      <button
        type="submit"
        className={`ztg-transition bg-ztg-blue text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full  font-bold text-ztg-16-150 h-ztg-40 ${className}`}
        onClick={(e) => click(e)}
        disabled={isDisabled() || disabled}
        data-test={dataTest}
      >
        {connected ? children : "Connect Wallet"}
      </button>
    );
  });

export default FormTransactionButton;
