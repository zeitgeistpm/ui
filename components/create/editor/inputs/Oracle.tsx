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
        : wallet.activeAccount?.name ?? "Account";

    return (
      <div className={`relative ${className}`}>
        <Input
          value={value}
          spellCheck={false}
          className={`mb-2 h-12 w-full rounded-md px-4 py-8 text-center transition-all duration-300
                  ${
                    !fieldState.isTouched || !fieldState.isValid
                      ? "bg-gray-100"
                      : "!bg-nyanza-base "
                  }`}
          placeholder="0x78e0e162...D3FFd434F7"
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {wallet?.activeAccount?.address ? (
          <div className="center">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={handleUseConnectedAccount}
                className={`
            
            relative flex items-center justify-center rounded-full border-2 border-gray-300 border-transparent bg-gray-100 text-sm transition-all 
            duration-200 ease-in-out
            ${!isSelectedAccount && " border-orange-300"}
          `}
              >
                <div
                  className={`relative h-full flex-1 px-3 py-2 transition-all duration-300 ease-[cubic-bezier(.57,.42,.25,1.57)] ${
                    isSelectedAccount ? "w-[120px]" : "w-[200px]"
                  }`}
                >
                  <div
                    className={`absolute left-0 top-[50%] translate-y-[-50%] ${
                      !isSelectedAccount
                        ? "min-w-[200px]  text-orange-300"
                        : "min-w-[120px]"
                    }`}
                  >
                    {!isSelectedAccount ? "Use connected wallet" : "Connected"}
                  </div>
                </div>

                <div
                  className={`center gap-2 rounded-full bg-gray-200 px-3 py-2 ${
                    isSelectedAccount ? "bg-nyanza-base" : "bg-gray-200"
                  }`}
                >
                  {wallet.realAddress && (
                    <>
                      <div className="pointer-events-none">
                        <Avatar address={wallet.realAddress} size={18} />
                      </div>
                      <span className="center gap-4 font-semibold">
                        {accountname ? (
                          <>
                            {accountname}{" "}
                            {shortenAddress(wallet.realAddress, 0, 6)}
                          </>
                        ) : (
                          <>{shortenAddress(wallet.realAddress, 6, 6)}</>
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
              className="flex rounded-full border-gray-300 bg-gray-100 text-sm transition-all active:scale-95"
            >
              <div className="px-4 py-2 text-gray-600">
                Connect to use wallet account
              </div>
              <div
                className={`rounded-full bg-orange-400 px-4 py-2 text-white`}
              >
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
