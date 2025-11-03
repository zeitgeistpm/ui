import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";

import React, { FC } from "react";

export interface AccountSelectRowProps {
  name: string;
  address: string;
}

const AccountSelectOption: FC<AccountSelectRowProps> = ({ name, address }) => {
  return (
    <div className="mb-2 flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-md bg-white/10 p-3 backdrop-blur-sm transition-all last:mb-0 hover:bg-white/20 md:mb-1.5 md:min-h-0 md:p-2.5">
      <div className="shrink-0">
        <div className="h-10 w-10 rounded-full ring-2 ring-white/20 md:h-9 md:w-9">
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
