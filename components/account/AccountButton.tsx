import { observer } from "mobx-react";
// import { Bell } from "react-feather";
import React, { useState } from "react";

import { formatNumberLocalized, shortenAddress } from "lib/util";
import { useStore } from "lib/stores/Store";
import Avatar from "components/ui/Avatar";
import { useUserStore } from "lib/stores/UserStore";
import { useAccountModals } from "lib/hooks/account";

const AccountButton = observer(() => {
  const store = useStore();
  const { wallets } = store;
  const { connected, activeAccount, activeBalance } = wallets;
  const accountModals = useAccountModals();
  const { locationAllowed, isUsingVPN } = useUserStore();
  const [hovering, setHovering] = useState<boolean>(false);

  const connect = async () => {
    accountModals.openWalletSelect();
  };

  const handleMouseEnter = () => {
    setHovering(true);
  };

  const handleMouseLeave = () => {
    setHovering(false);
  };

  return (
    <>
      {!connected ? (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <button
            className="flex w-ztg-168 h-ztg-40 bg-sky-400 dark:bg-sky-700 text-black dark:text-white rounded-full text-ztg-14-150 
          font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-20"
            onClick={() => connect()}
            disabled={locationAllowed !== true || isUsingVPN}
          >
            Connect Wallet
          </button>
          {(hovering === true && locationAllowed !== true) ||
          isUsingVPN === true ? (
            <div
              className="bg-white dark:bg-sky-1100 absolute rounded-ztg-10 font-bold text-black dark:text-white 
            px-ztg-10 py-ztg-14 font-lato text-ztg-12-150 top-ztg-50 z-20 right-10"
            >
              {locationAllowed !== true
                ? "Your jurisdiction is not authorised to trade"
                : "Trading over a VPN is not allowed due to legal restrictions"}
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="flex h-ztg-40">
          <div
            className="w-ztg-360 flex pl-ztg-25 h-full font-mono text-ztg-14-150 rounded-full cursor-pointer bg-sky-200 dark:bg-sky-700 dark:text-white"
            onClick={() => {
              accountModals.openAccontSelect();
            }}
          >
            <div className="font-bold mr-ztg-16 center w-ztg-176 ">
              {`${formatNumberLocalized(activeBalance?.toNumber())} ${
                store.config.tokenSymbol
              }`}
            </div>
            <div className="center bg-sky-500 dark:bg-black rounded-full h-full w-ztg-164 flex-grow text-white pl-ztg-6 pr-ztg-10">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Avatar zoomed address={activeAccount.address} />
              </div>
              <div className="mr-auto text-black dark:text-white ml-ztg-10">
                {shortenAddress(activeAccount.address, 6, 4)}
              </div>
            </div>
          </div>
          {/* TODO */}
          {/* <div className="ml-ztg-18 center cursor-pointer dark:text-sky-600">
            <Bell size={24} />
          </div> */}
        </div>
      )}
    </>
  );
});

export default AccountButton;
