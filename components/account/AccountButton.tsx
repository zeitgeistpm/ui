import { observer } from "mobx-react";
import React, { FC, useEffect, useState } from "react";

import { formatNumberLocalized, shortenAddress } from "lib/util";
import { useStore } from "lib/stores/Store";
import Avatar from "components/ui/Avatar";
import { useUserStore } from "lib/stores/UserStore";
import { useAccountModals } from "lib/hooks/account";
import { useModalStore } from "lib/stores/ModalStore";
import { usePrevious } from "lib/hooks/usePrevious";
import { useRouter } from "next/router";

const AccountButton: FC<{
  connectButtonClassname?: string;
  connectButtonText?: string | JSX.Element;
  autoClose?: boolean;
  avatarDeps?: any[];
}> = observer(
  ({ connectButtonClassname, connectButtonText, autoClose, avatarDeps }) => {
    const store = useStore();
    const { wallets } = store;
    const { connected, activeAccount, activeBalance } = wallets;
    const modalStore = useModalStore();
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

    const prevactiveAccount = usePrevious(activeAccount);

    const { pathname } = useRouter();

    useEffect(() => {
      if (autoClose && activeAccount !== prevactiveAccount) {
        modalStore.closeModal();
      }
    }, [activeAccount]);

    return (
      <>
        {!connected ? (
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
              className={
                connectButtonClassname ||
                "flex text-black rounded-full font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-20"
              }
              onClick={() => connect()}
              disabled={
                locationAllowed !== true || isUsingVPN || !store?.sdk?.api
              }
            >
              {connectButtonText || "Connect Wallet"}
            </button>

            {hovering === true &&
            (locationAllowed !== true || isUsingVPN === true) ? (
              <div className="bg-white absolute rounded font-bold text-black">
                {locationAllowed !== true
                  ? "Your jurisdiction is not authorised to trade"
                  : "Trading over a VPN is not allowed due to legal restrictions"}
              </div>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <div
            className={`flex flex-1	items-center justify-end h-full rounded-full cursor-pointer ${
              pathname === "/" ? "bg-transparent border-white" : "border-black"
            }`}
            onClick={() => {
              accountModals.openAccontSelect();
            }}
          >
            <span
              className={`relative whitespace-nowrap left-5 pr-8 pl-6 font-medium text-sm rounded-l-full h-full border-2 border-r-0 leading-[40px] ${
                pathname === "/"
                  ? "bg-transparent border-white text-white"
                  : "border-black text-black"
              }`}
            >
              {`${formatNumberLocalized(activeBalance?.toNumber())} ${
                store.config.tokenSymbol
              }`}
            </span>
            <div
              className={`flex items-center rounded-full h-full border-2 pl-1.5 pr-4 ${
                pathname === "/"
                  ? "text-white border-white"
                  : "text-black border-black"
              }`}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Avatar
                  zoomed
                  address={activeAccount.address}
                  deps={avatarDeps}
                />
              </div>
              <span
                className={`font-medium pl-4 text-sm h-full leading-[40px] ${
                  pathname === "/" ? "text-white" : "text-black"
                }`}
              >
                {shortenAddress(activeAccount.address, 6, 4)}
              </span>
            </div>
            {/* TODO */}
            {/* <div className="ml-ztg-18 center cursor-pointer dark:text-sky-600">
            <Bell size={24} />
          </div> */}
          </div>
        )}
      </>
    );
  },
);

export default AccountButton;
