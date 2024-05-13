import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { ZTG } from "lib/constants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useAccountModals } from "lib/state/account";
import { useWallet } from "lib/state/wallet";
import { FC, PropsWithChildren, useMemo } from "react";
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
  connectText = "Sign In",
  loading,
}) => {
  const wallet = useWallet();
  const [sdk] = useSdkv2();
  const accountModals = useAccountModals();

  const extrinsicBase = useMemo(() => {
    return extrinsic && isRpcSdk(sdk) && wallet.activeAccount?.address
      ? sdk.api.tx.balances.transfer(
          wallet.activeAccount?.address,
          ZTG.toFixed(0),
        )
      : undefined;
  }, [extrinsic, sdk]);

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
    if (!isRpcSdk(sdk) || insufficientFeeBalance) {
      return true;
    } else if (!wallet.connected) {
      return false;
    }
    return disabled;
  }, [sdk, wallet, insufficientFeeBalance]);

  const colorClass = insufficientFeeBalance ? "bg-vermilion" : "bg-ztg-blue";

  const getButtonChildren = () => {
    if (insufficientFeeBalance) {
      return `Insufficient ${fee.symbol}`;
    } else if (loading) {
      return (
        <div className="center w-full rounded-full bg-inherit">
          <Loader variant={"Dark"} className="z-20 h-6 w-6" loading />
        </div>
      );
    } else if (wallet.connected) {
      return children;
    } else {
      return connectText;
    }
  };
  return (
    <button
      type={type}
      className={`ztg-transition h-[56px] w-full rounded-full text-white 
        focus:outline-none disabled:cursor-default  ${
          !isDisabled && "active:scale-95"
        } ${colorClass} ${className} disabled:!bg-slate-300`}
      onClick={(e) => click(e)}
      disabled={isDisabled}
      data-test={dataTest}
    >
      {getButtonChildren()}
    </button>
  );
};

export default TransactionButton;
