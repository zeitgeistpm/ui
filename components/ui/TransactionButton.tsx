import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { ZTG } from "lib/constants";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useAccountModals } from "lib/state/account";
import { useWallet } from "lib/state/wallet";
import { FC, PropsWithChildren, useMemo } from "react";
import Decimal from "decimal.js";

interface TransactionButtonProps {
  preventDefault?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  className?: string;
  dataTest?: string;
  type?: "button" | "submit" | "reset";
  extrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>;
  disableFeeCheck?: boolean;
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
}) => {
  const wallet = useWallet();
  const [sdk] = useSdkv2();
  const accountModals = useAccountModals();
  const { locationAllowed, isUsingVPN } = useUserLocation();
  const extrinsicBase =
    extrinsic ??
    (wallet.activeAccount?.address
      ? sdk
          ?.asRpc()
          .api.tx.balances.transfer(
            wallet.activeAccount?.address,
            ZTG.toFixed(0),
          )
      : undefined);
  const { data: fee } = useExtrinsicFee(extrinsicBase);
  const { data: balance } = useBalance(wallet.activeAccount?.address, {
    Ztg: null,
  });
  const { data: constants } = useChainConstants();

  const feeEstimationFactor = extrinsic ? 1.05 : 1.5;
  const insufficientFeeBalance =
    disableFeeCheck === false &&
    balance?.lessThan(fee?.mul(feeEstimationFactor) ?? 0);

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
    if (
      locationAllowed !== true ||
      isUsingVPN ||
      !isRpcSdk(sdk) ||
      insufficientFeeBalance
    ) {
      return true;
    } else if (!wallet.connected) {
      return false;
    }
    return disabled;
  }, [locationAllowed, isUsingVPN, sdk, wallet, insufficientFeeBalance]);

  const colorClass =
    locationAllowed !== true || isUsingVPN || insufficientFeeBalance
      ? "bg-vermilion"
      : "bg-ztg-blue";

  const getButtonChildren = () => {
    if (locationAllowed !== true) {
      return "Location Blocked";
    } else if (isUsingVPN) {
      return "VPN Blocked";
    } else if (insufficientFeeBalance) {
      return `Insufficient ${constants?.tokenSymbol}`;
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
        rounded-full w-full h-[56px] ${
          !isDisabled && "active:scale-95"
        } ${className} ${colorClass}`}
      onClick={(e) => click(e)}
      disabled={isDisabled}
      data-test={dataTest}
    >
      {getButtonChildren()}
      <span className="block text-xs font-normal">
        Estimated Fees: {fee?.div(ZTG).toFixed(3)} {constants?.tokenSymbol}
      </span>
    </button>
  );
};

export default TransactionButton;
