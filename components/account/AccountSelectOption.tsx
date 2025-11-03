import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";

import React, { FC } from "react";

export interface AccountSelectRowProps {
  name: string;
  address: string;
}

const AccountSelectOption: FC<AccountSelectRowProps> = ({ name, address }) => {
  return (
    <div className="mb-1.5 flex cursor-pointer items-center gap-3 rounded-md bg-white/10 p-2.5 backdrop-blur-sm transition-all last:mb-0 hover:bg-white/20">
      <div className="shrink-0">
        <div className="h-9 w-9 rounded-full ring-2 ring-white/20">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="text-sm font-semibold text-white/90">{name}</div>
        <div className="text-xs font-medium text-white/70">
          {shortenAddress(address, 8, 12)}
        </div>
      </div>
    </div>
  );
};
export default AccountSelectOption;
