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
  const wallet = useWallet();
  return (
    <div className="flex h-full w-full items-center rounded-lg bg-sky-100 px-2">
      <div className="center rounded-full bg-white">
        <div className="rounded-full bg-sky-100">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="ml-4 flex flex-col">
        <div className="text-xxs font-bold uppercase text-sky-600">{name}</div>
        <div className="flex items-center gap-1 font-mono text-sm font-semibold md:hidden">
          {shortenAddress(address, 8, 12)}
          <IoIosArrowDropdownCircle size={16} />
        </div>
        <div className="hidden gap-1 font-mono text-sm font-semibold md:flex">
          {address}
          {wallet.activeAccount?.address && (
            <IoIosArrowDropdownCircle size={18} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSelectValue;
