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
  type?: "button" | "submit" | "reset";
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
      type = "button",
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

      const colorClass =
        locationAllowed !== true || isUsingVPN ? "bg-vermilion" : "bg-ztg-blue";

      const getButtonChildren = () => {
        if (locationAllowed !== true) {
          return "Location Blocked";
        } else if (isUsingVPN) {
          return "VPN Blocked";
        } else if (wallet.connected) {
          return children;
        } else {
          return "Connect Wallet";
        }
      };

      return (
        <button
          type={type}
          className={`ztg-transition text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full font-bold text-ztg-16-150 h-ztg-56 ${className} ${colorClass}`}
          onClick={(e) => click(e)}
          disabled={isDisabled()}
          data-test={dataTest}
        >
          {getButtonChildren()}
        </button>
      );
    },
  );

export default TransactionButton;
