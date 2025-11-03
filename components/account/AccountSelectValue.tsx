import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";
import CopyIcon from "../ui/CopyIcon";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import React, { FC } from "react";
import { useWallet } from "lib/state/wallet";
export interface AccountSelectValueProps {
  name: string;
  address: string;
}

const AccountSelectValue: FC<AccountSelectValueProps> = ({ name, address }) => {
  return (
    <div className="flex h-full w-full items-center gap-3 px-3 py-2">
      <div className="shrink-0">
        <div className="h-9 w-9 rounded-full ring-2 ring-white/20">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="truncate text-xs font-semibold uppercase tracking-wide text-white/70">
            {name}
          </div>
          <div className="truncate text-sm font-medium text-white/90">
            {shortenAddress(address, 10, 8)}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <IoIosArrowDropdownCircle className="text-white/70" size={20} />
        </div>
      </div>
    </div>
  );
};

export default AccountSelectValue;
