import { observer } from "mobx-react";
import { FC } from "react";
import { useStore } from "lib/stores/Store";
import { useUserStore } from "lib/stores/UserStore";
import { useAccountModals } from "lib/hooks/account";

interface TransactionButtonProps {
  onClick: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  className?: string;
  dataTest?: string;
}

const TransactionButton: FC<TransactionButtonProps> = observer(
  ({ onClick, disabled = false, className = "", dataTest = "", children }) => {
    const store = useStore();
    const { wallets } = store;
    const { connected } = wallets;
    const accountModals = useAccountModals();
    const { locationAllowed } = useUserStore();

    const click = (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (!connected) {
        accountModals.openWalletSelect();
      } else {
        onClick(event);
      }
    };

    const isDisabled = () => {
      if (locationAllowed !== true) {
        return true;
      } else if (!connected) {
        return false;
      }
      return disabled;
    };

    return (
      <button
        className={`ztg-transition bg-ztg-blue text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full font-space font-bold text-ztg-16-150 h-ztg-40 ${className}`}
        onClick={(e) => click(e)}
        disabled={isDisabled()}
        data-test={dataTest}
      >
        {connected ? children : "Connect Wallet"}
      </button>
    );
  }
);

export default TransactionButton;
