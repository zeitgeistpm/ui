import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useAccountModals } from "lib/state/account";
import { useWallet } from "lib/state/wallet";
import { FC, PropsWithChildren, useMemo, useState, useEffect } from "react";
import { Loader } from "./Loader";

interface TransactionButtonProps {
  preventDefault?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  className?: string;
  dataTest?: string;
  type?: "button" | "submit" | "reset";
  extrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>;
  disableFeeCheck?: boolean;
  loading?: boolean;
  connectText?: string;
  variant?: "green" | "red";
}

const TransactionButton: FC<PropsWithChildren<TransactionButtonProps>> = ({
  onClick,
  disabled = false,
  className = "",
  dataTest = "",
  children,
  preventDefault,
  type = "button",
  extrinsic,
  disableFeeCheck = false,
  connectText = "Connect Wallet",
  loading,
  variant = "green",
}) => {
  const wallet = useWallet();
  const [sdk] = useSdkv2();
  const accountModals = useAccountModals();
  const { locationAllowed, isLoading: locationLoading } = useUserLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const extrinsicBase = useMemo(() => {
    return extrinsic && isRpcSdk(sdk) && wallet.activeAccount?.address
      ? sdk.api.tx.balances.transfer(
          wallet.activeAccount?.address,
          ZTG.toFixed(0),
        )
      : undefined;
  }, [extrinsic, sdk, wallet.activeAccount?.address]);

  const { data: fee } = useExtrinsicFee(extrinsicBase);

  const insufficientFeeBalance = fee?.sufficientBalance === false;

  const click = (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (preventDefault) {
      event?.preventDefault();
    }
    if (!wallet.connected) {
      accountModals.openWalletSelect();
    } else {
      onClick && onClick(event);
    }
  };

  const isDisabled = useMemo(() => {
    // During SSR, use safe default to prevent hydration mismatch
    if (!mounted) {
      return false; // Always enabled on server to match client initial state
    }

    // During location loading, only disable based on basic conditions
    if (locationLoading) {
      return disabled;
    }

    // After fully mounted and location determined
    if (locationAllowed !== true || !isRpcSdk(sdk) || insufficientFeeBalance) {
      return true;
    } else if (!wallet.connected) {
      return false;
    }
    return disabled;
  }, [
    mounted,
    locationLoading,
    locationAllowed,
    sdk,
    wallet.connected,
    insufficientFeeBalance,
    disabled,
  ]);

  const colorClass = useMemo(() => {
    // Determine base color based on variant
    const baseColor =
      variant === "red"
        ? "bg-ztg-red-600/80 hover:bg-ztg-red-600"
        : "bg-ztg-green-600/80 hover:bg-ztg-green-600 backdrop-blur-sm";

    // During SSR, use safe default color
    if (!mounted) {
      return baseColor;
    }

    // During location loading, use default color
    if (locationLoading) {
      return baseColor;
    }

    // After fully mounted and location determined
    // Error states always use red, otherwise use variant color
    return locationAllowed !== true || insufficientFeeBalance
      ? "bg-ztg-red-600/80 hover:bg-ztg-red-600"
      : baseColor;
  }, [
    mounted,
    locationLoading,
    locationAllowed,
    insufficientFeeBalance,
    variant,
  ]);

  const getButtonChildren = () => {
    // Always wrap content in consistent structure for hydration
    const content = (() => {
      // During SSR or initial client render, always show simple loading or default state
      // to prevent hydration mismatches
      if (!mounted) {
        // On server, show connect text as default safe state
        return connectText;
      }

      // After mounting, show loading if explicitly loading
      if (loading) {
        return <Loader variant={"Dark"} className="z-20 h-6 w-6" loading />;
      }

      // During location loading, show current children
      if (locationLoading) {
        return wallet.connected ? children : connectText;
      }

      // After fully mounted and location checked, show appropriate state
      if (locationAllowed !== true) {
        return "Location Blocked";
      } else if (insufficientFeeBalance && fee?.symbol) {
        return `Insufficient ${fee.symbol}`;
      } else if (wallet.connected) {
        return children;
      } else {
        return connectText;
      }
    })();

    // Always wrap in consistent div structure for hydration consistency
    return <div className="center w-full">{content}</div>;
  };

  return (
    <button
      type={type}
      className={`ztg-transition h-[56px] w-full rounded-full font-bold text-white shadow-lg
        transition-all duration-200 focus:outline-none disabled:cursor-default ${
          !isDisabled && "hover:shadow-xl active:scale-[0.97]"
        } ${colorClass} ${className} disabled:!bg-ztg-primary-300`}
      onClick={(e) => click(e)}
      disabled={isDisabled}
      data-test={dataTest}
    >
      {getButtonChildren()}
    </button>
  );
};

export default TransactionButton;
