import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";

import React, { FC } from "react";

export interface AccountSelectRowProps {
  name: string;
  address: string;
}

const AccountSelectOption: FC<AccountSelectRowProps> = ({ name, address }) => {
  return (
    <div className="flex p-ztg-8 items-center bg-sky-100 dark:bg-black cursor-pointer text-black dark:text-white">
      <div className="center rounded-full w-ztg-28 h-ztg-28">
        <div className="mr-4 rounded-full w-ztg-22 h-ztg-22 bg-sky-100 dark:bg-black">
          <Avatar zoomed address={address} />
        </div>
      </div>
      <div className="flex flex-col mr-ztg-10">
        <div className="text-ztg-12-120 font-medium">{name}</div>
        <div className="font-mono text-ztg-12-120 font-semibold md:hidden">
          {shortenAddress(address, 12, 12)}
        </div>
        <div className="font-mono text-ztg-12-120 font-semibold hidden md:block">
          {address}
        </div>
      </div>
    </div>
  );
};
export default AccountSelectOption;
