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
      <div className={`relative ${className}`}>
        <Input
          value={value}
          spellCheck={false}
          className={`mb-1.5 h-8 w-full rounded-md border px-2.5 text-center text-xs backdrop-blur-md transition-all
                  ${
                    !fieldState.isTouched || !fieldState.isValid
                      ? "border-sky-200/30 bg-sky-50/50"
                      : "border-sky-200/30 bg-white/80"
                  }`}
          placeholder="0x..."
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {wallet?.activeAccount?.address ? (
          <div className="center">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={handleUseConnectedAccount}
                className={`relative flex items-center justify-center rounded-full border text-xs backdrop-blur-md transition-all duration-200 ease-in-out active:scale-95 ${
                  !isSelectedAccount
                    ? "border-orange-300/50 bg-orange-50/50 hover:bg-orange-100/50"
                    : "border-sky-200/30 bg-white/80"
                }`}
              >
                <div
                  className={`relative h-full flex-1 px-3 py-1.5 transition-all duration-300 ease-[cubic-bezier(.57,.42,.25,1.57)] ${
                    isSelectedAccount ? "w-[100px]" : "w-[160px]"
                  }`}
                >
                  <div
                    className={`absolute left-0 top-[50%] translate-y-[-50%] font-medium ${
                      !isSelectedAccount
                        ? "min-w-[160px] text-orange-500"
                        : "min-w-[100px] text-sky-900"
                    }`}
                  >
                    {!isSelectedAccount ? "Use connected" : "Connected"}
                  </div>
                </div>

                <div
                  className={`center gap-1.5 rounded-full px-2.5 py-1.5 ${
                    isSelectedAccount
                      ? "bg-sky-600/90 text-white"
                      : "bg-orange-500/90 text-white"
                  }`}
                >
                  {wallet.realAddress && (
                    <>
                      <div className="pointer-events-none">
                        <Avatar address={wallet.realAddress} size={16} />
                      </div>
                      <span className="center gap-2 text-xs font-semibold">
                        {accountname ? (
                          <>
                            {accountname}{" "}
                            {shortenAddress(wallet.realAddress, 0, 5)}
                          </>
                        ) : (
                          <>{shortenAddress(wallet.realAddress, 5, 5)}</>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="center">
            <button
              type="button"
              onClick={() => accountModals.openWalletSelect()}
              className="flex rounded-full border border-sky-200/30 bg-white/80 text-xs backdrop-blur-md transition-all hover:bg-sky-100/80 active:scale-95"
            >
              <div className="px-3 py-1.5 font-medium text-sky-900">
                Connect to use wallet account
              </div>
              <div className="rounded-full bg-orange-500 px-3 py-1.5 font-semibold text-white">
                Connect
              </div>
            </button>
          </div>
        )}
      </div>
    );
  },
);

export default OracleInput;
