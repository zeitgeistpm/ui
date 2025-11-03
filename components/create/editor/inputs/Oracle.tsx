import Avatar from "components/ui/Avatar";
import { useAccountModals } from "lib/state/account";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { ChangeEventHandler, forwardRef } from "react";
import { FormEvent } from "../types";
import Input from "components/ui/Input";

export type OracleInputProps = {
  name: string;
  value?: string;
  fieldState: FieldState;
  className?: string;
  onBlur: (event: FormEvent<string>) => void;
  onChange: (event: FormEvent<string>) => void;
};

export const OracleInput = forwardRef(
  ({
    name,
    value,
    fieldState,
    className,
    onChange,
    onBlur,
  }: OracleInputProps) => {
    const wallet = useWallet();
    const accountModals = useAccountModals();

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      onChange?.({
        type: "change",
        target: {
          name,
          value: event.target.value,
        },
      });
    };

    const handleBlur = (event: FormEvent<string>) => {
      onBlur?.({
        type: "blur",
        target: {
          name,
          value: event.target.value,
        },
      });
    };

    const handleUseConnectedAccount = () => {
      if (!wallet?.realAddress) return;
      onChange?.({
        type: "change",
        target: {
          name,
          value: wallet.realAddress,
        },
      });
    };

    const handleChangeAccount = (address: string) => {
      onChange?.({
        type: "change",
        target: {
          name,
          value: address,
        },
      });
    };

    const isSelectedAccount = wallet.realAddress === value;
    const proxy = wallet.getProxyFor(wallet.activeAccount?.address);
    const accountname =
      proxy && proxy?.enabled
        ? "Proxied"
        : (wallet.activeAccount?.name ?? "Account");

    return (
      <div className={`flex w-full items-center gap-2 ${className}`}>
        <div className="w-1/2">
          <Input
            value={value}
            spellCheck={false}
            className="w-full rounded-lg border-2 border-white/20 bg-white/10 px-4 py-3 text-left text-sm text-white backdrop-blur-sm transition-all placeholder:text-white/50 hover:border-white/30"
            placeholder="0x..."
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>
        {wallet?.activeAccount?.address ? (
          <div className="w-1/2">
            <button
              type="button"
              onClick={handleUseConnectedAccount}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all active:scale-95 ${
                !isSelectedAccount
                  ? "border-orange-500/60 bg-orange-500/10 text-orange-400 hover:border-orange-500/80 hover:bg-orange-500/20"
                  : "border-ztg-green-600/80 bg-ztg-green-600/90 text-white shadow-md hover:bg-ztg-green-600 hover:border-ztg-green-500"
              }`}
            >
              {wallet.realAddress && (
                <>
                  <div className="pointer-events-none">
                    <Avatar address={wallet.realAddress} size={16} />
                  </div>
                  <span className="truncate">
                    {!isSelectedAccount ? (
                      "Use connected"
                    ) : (
                      <>
                        {accountname && `${accountname} `}
                        {shortenAddress(wallet.realAddress, 0, 5)}
                      </>
                    )}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="w-1/2">
            <button
              type="button"
              onClick={() => accountModals.openWalletSelect()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/30 active:scale-95"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    );
  },
);

export default OracleInput;
