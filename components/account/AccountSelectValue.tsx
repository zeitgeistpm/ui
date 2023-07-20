import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";

import React, { FC } from "react";

export interface AccountSelectValueProps {
  name: string;
  address: string;
}

const AccountSelectValue: FC<AccountSelectValueProps> = ({ name, address }) => {
  return (
    <div className="flex items-center  h-full w-full px-ztg-8 bg-sky-100 dark:bg-black rounded-ztg-10">
      <div className="center rounded-full w-ztg-28 h-ztg-28 bg-white dark:bg-sky-1000">
        <div className="rounded-full w-ztg-22 h-ztg-22 bg-sky-100 dark:bg-black">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="flex flex-col ml-ztg-16">
        <div className="font-bold text-sky-600 text-ztg-10-150 uppercase">
          {name}
        </div>
        <div className="font-mono text-ztg-12-120 font-semibold md:hidden">
          {shortenAddress(address, 8, 12)}
        </div>
        <div className="font-mono text-ztg-12-120 font-semibold hidden md:block">
          {address}
        </div>
      </div>
    </div>
  );
};

export default AccountSelectValue;
