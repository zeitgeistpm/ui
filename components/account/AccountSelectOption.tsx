import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";

import React, { FC } from "react";

export interface AccountSelectRowProps {
  name: string;
  address: string;
}

const AccountSelectOption: FC<AccountSelectRowProps> = ({ name, address }) => {
  return (
    <div className="flex cursor-pointer items-center bg-sky-100 p-ztg-8 text-black dark:bg-black dark:text-white">
      <div className="center h-ztg-28 w-ztg-28 rounded-full">
        <div className="mr-4 h-ztg-22 w-ztg-22 rounded-full bg-sky-100 dark:bg-black">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="mr-ztg-10 flex flex-col">
        <div className="text-ztg-12-120 font-medium">{name}</div>
        <div className="font-mono text-ztg-12-120 font-semibold md:hidden">
          {shortenAddress(address, 12, 12)}
        </div>
        <div className="hidden font-mono text-ztg-12-120 font-semibold md:block">
          {address}
        </div>
      </div>
    </div>
  );
};
export default AccountSelectOption;
