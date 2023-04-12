import { observer } from "mobx-react";
import { FC, PropsWithChildren } from "react";
import { useStore } from "lib/stores/Store";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useAccountModals } from "lib/hooks/account";
import { useWallet } from "lib/state/wallet";

interface TransactionButtonProps {
  preventDefault?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  className?: string;
  dataTest?: string;
}

const TransactionButton: FC<PropsWithChildren<TransactionButtonProps>> =
  observer(
    ({
      onClick,
      disabled = false,
      className = "",
      dataTest = "",
      children,
      preventDefault,
    }) => {
      const store = useStore();
      const wallet = useWallet();
      const accountModals = useAccountModals();
      const { locationAllowed, isUsingVPN } = useUserLocation();

      const click = (
        event?: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      ) => {
        if (preventDefault) {
          event.preventDefault();
        }
        if (!wallet.connected) {
          accountModals.openWalletSelect();
        } else {
          onClick && onClick(event);
        }
      };

      const isDisabled = () => {
        if (locationAllowed !== true || isUsingVPN || !store?.sdk?.api) {
          return true;
        } else if (!wallet.connected) {
          return false;
        }
        return disabled;
      };

      return (
        <button
          className={`ztg-transition bg-ztg-blue text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full  font-bold text-ztg-16-150 h-ztg-56 ${className}`}
          onClick={(e) => click(e)}
          disabled={isDisabled()}
          data-test={dataTest}
        >
          {wallet.connected ? children : "Connect Wallet"}
        </button>
      );
    },
  );

export default TransactionButton;
