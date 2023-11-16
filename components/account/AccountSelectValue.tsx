import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";

import React, { FC } from "react";

export interface AccountSelectValueProps {
  name: string;
  address: string;
}

const AccountSelectValue: FC<AccountSelectValueProps> = ({ name, address }) => {
  return (
    <div className="flex h-full  w-full items-center rounded-ztg-10 bg-sky-100 px-ztg-8 dark:bg-black">
      <div className="center h-ztg-28 w-ztg-28 rounded-full bg-white dark:bg-sky-1000">
        <div className="h-ztg-22 w-ztg-22 rounded-full bg-sky-100 dark:bg-black">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="ml-ztg-16 flex flex-col">
        <div className="text-ztg-10-150 font-bold uppercase text-sky-600">
          {name}
        </div>
        <div className="font-mono text-ztg-12-120 font-semibold md:hidden">
          {shortenAddress(address, 8, 12)}
        </div>
        <div className="hidden font-mono text-ztg-12-120 font-semibold md:block">
          {address}
        </div>
      </div>
    </div>
  );
};

export default AccountSelectValue;
