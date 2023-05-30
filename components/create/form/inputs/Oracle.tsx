import { SupportedTag, defaultTags } from "lib/constants/markets";
import Image from "next/image";
import {
  ChangeEventHandler,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FormEvent } from "../types";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import Avatar from "components/ui/Avatar";
import { usePrevious } from "lib/hooks/usePrevious";

export type OracleInputProps = {
  name: string;
  value: string;
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
      onChange?.({
        type: "change",
        target: {
          name,
          value: wallet.activeAccount?.address,
        },
      });
    };

    const isSelectedAccount = wallet.activeAccount?.address === value;

    return (
      <div className={`relative ${className}`}>
        <input
          value={value}
          spellCheck={false}
          className={`h-12 w-full text-center rounded-md mb-2 px-4 py-8
                  ${
                    !fieldState.isTouched || !fieldState.isValid
                      ? "bg-gray-100"
                      : "!bg-nyanza-base "
                  }`}
          placeholder="0x78e0e162...D3FFd434F7"
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {wallet?.activeAccount?.address && (
          <div className="center">
            <button
              type="button"
              onClick={handleUseConnectedAccount}
              className={`
            flex justify-center items-center
            border-gray-300 text-sm bg-gray-100 rounded-full transition-all ease-in-out duration-200 mb-4 border-2 border-transparent
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
                <Avatar address={wallet.activeAccount?.address} size={18} />
                <span className="font-semibold center gap-4">
                  {shortenAddress(wallet.activeAccount?.address, 6, 6)}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  },
);

export default OracleInput;
