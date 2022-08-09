import { observer } from "mobx-react";
import React, { FC, useRef, useState } from "react";
import { FaWallet } from "react-icons/fa";
import { useStore } from "lib/stores/Store";
import AccountButton from "components/account/AccountButton";

const DefaultLayout: FC<{ launchDate: Date }> = observer(
  ({ children, launchDate }) => {
    const store = useStore();

    const {
      wallets: { activeAccount },
    } = store;

    return (
      <div className="relative flex min-h-screen justify-evenly bg-white overflow-hidden">
        <div className="absolute bottom-10 ">
          <AccountButton
            connectButtonClassname="animate-pulse text-white flex w-ztg-168 h-ztg-40 bg-blue-500  text-black rounded-full text-ztg-14-150 font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-20"
            connectButtonText={
              <div className="flex items-center">
                <FaWallet />
                <span className="ml-2">Connect Wallet</span>
              </div>
            }
          />
        </div>
      </div>
    );
  },
);

export default DefaultLayout;
