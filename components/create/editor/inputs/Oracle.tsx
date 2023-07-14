import Avatar from "components/ui/Avatar";
import { useAccountModals } from "lib/state/account";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { ChangeEventHandler, forwardRef } from "react";
import { FormEvent } from "../types";

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
        <input
          value={value}
          spellCheck={false}
          className={`h-12 w-full text-center rounded-md mb-2 px-4 py-8 transition-all duration-300
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
            <div className="relative flex justify-center items-center">
              <button
                type="button"
                onClick={handleUseConnectedAccount}
                className={`
            
            border-gray-300 text-sm relative flex justify-center items-center bg-gray-100 rounded-full transition-all ease-in-out duration-200 
            border-2 border-transparent
            ${!isSelectedAccount && " border-orange-300"}
          `}
              >
                <div
                  className={`relative flex-1 h-full py-2 px-3 transition-all duration-300 ease-[cubic-bezier(.57,.42,.25,1.57)] ${
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
                  className={`center gap-2 bg-gray-200 py-2 px-3 rounded-full ${
                    isSelectedAccount ? "bg-nyanza-base" : "bg-gray-200"
                  }`}
                >
                  {wallet.realAddress && (
                    <>
                      <div className="pointer-events-none">
                        <Avatar address={wallet.realAddress} size={18} />
                      </div>
                      <span className="font-semibold center gap-4">
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
              className="flex border-gray-300 text-sm bg-gray-100 rounded-full transition-all active:scale-95"
            >
              <div className="py-2 px-4 text-gray-600">
                Connect to use wallet account
              </div>
              <div
                className={`bg-orange-400 text-white py-2 px-4 rounded-full`}
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
