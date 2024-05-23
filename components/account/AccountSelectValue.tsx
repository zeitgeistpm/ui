import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";
import CopyIcon from "../ui/CopyIcon";
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
        <div className="font-mono text-sm font-semibold md:hidden">
          {shortenAddress(address, 8, 12)}
        </div>
        <div className="hidden font-mono text-xs font-semibold md:flex">
          {address}
          {wallet.activeAccount?.address && (
            <CopyIcon
              copyText={wallet.activeAccount?.address}
              className="w-auto px-1"
              size={12}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSelectValue;
