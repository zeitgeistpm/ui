import Avatar from "components/ui/Avatar";
import { observer } from "mobx-react";
import React, { FC } from "react";

export interface AccountSelectRowProps {
  name: string;
  address: string;
}

const AccountSelectOption: FC<AccountSelectRowProps> = observer(
  ({ name, address }) => {
    return (
      <div className="flex p-ztg-8 items-center bg-sky-100 dark:bg-black cursor-pointer text-black dark:text-white">
        <div className="center rounded-full w-ztg-28 h-ztg-28 bg-white dark:bg-sky-1000">
          <div className="center rounded-full w-ztg-22 h-ztg-22 bg-sky-100 dark:bg-black">
            <div className="center rounded-full w-ztg-16 h-ztg-16 bg-sky-100 dark:bg-sky-1000">
              <Avatar address={address} />
            </div>
          </div>
        </div>
        <div className="flex flex-col mr-ztg-10">
          <div className="text-ztg-12-120 font-medium">{name}</div>
          <div className="font-mono text-ztg-12-120 font-semibold">
            {address}
          </div>
        </div>
      </div>
    );
  }
);

export default AccountSelectOption;
