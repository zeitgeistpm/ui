import { observer } from "mobx-react";
import { FC } from "react";
import { useStore } from "lib/stores/Store";
import { useUserStore } from "lib/stores/UserStore";
import { useAccountModals } from "lib/hooks/account";

interface TransactionButtonProps {
  preventDefault?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  className?: string;
  dataTest?: string;
}

const TransactionButton: FC<TransactionButtonProps> = observer(
  ({
    onClick,
    disabled = false,
    className = "",
    dataTest = "",
    children,
    preventDefault,
  }) => {
    const store = useStore();
    const { wallets } = store;
    const { connected } = wallets;
    const accountModals = useAccountModals();
    const { locationAllowed, isUsingVPN } = useUserStore();

    const click = (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (preventDefault) {
        event.preventDefault();
      }
      if (!connected) {
        accountModals.openWalletSelect();
      } else {
        onClick && onClick(event);
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
        className={`ztg-transition bg-ztg-blue text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full  font-bold text-ztg-16-150 h-ztg-40 ${className}`}
        onClick={(e) => click(e)}
        disabled={isDisabled()}
        data-test={dataTest}
      >
        {connected ? children : "Connect Wallet"}
      </button>
    );
  },
);

export default TransactionButton;
