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
import { getWallets } from "@talismn/connect-wallets";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import Modal from "components/ui/Modal";
import OnBoardingModal from "./OnboardingModal";

const AccountButton: FC<{
  connectButtonClassname?: string;
  autoClose?: boolean;
  avatarDeps?: any[];
}> = observer(({ connectButtonClassname, autoClose, avatarDeps }) => {
  const store = useStore();
  const { wallets } = store;
  const { connected, activeAccount, activeBalance } = wallets;
  const modalStore = useModalStore();
  const accountModals = useAccountModals();
  const { locationAllowed, isUsingVPN } = useUserStore();
  const [hovering, setHovering] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  const hasWallet =
    typeof window !== "undefined" &&
    getWallets().some(
      (wallet) =>
        wallet?.installed &&
        SUPPORTED_WALLET_NAMES.some(
          (walletName) => walletName === wallet.extensionName,
        ),
    );

  const handleClick = () => {
    hasWallet ? connect() : setShowOnboarding(true);
  };

  return (
    <>
      {!connected ? (
        <div
          className="hidden md:block flex-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={
              connectButtonClassname ||
              `flex border-2 rounded-full px-6 leading-[40px] ml-auto ${
                pathname === "/"
                  ? "text-white bg-transparent border-white"
                  : "text-black border-black"
              } rounded-full font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-30`
            }
            onClick={() => handleClick()}
            disabled={
              locationAllowed !== true || isUsingVPN || !store?.sdk?.api
            }
          >
            {hasWallet === true ? "Connect Wallet" : "Get Started"}
          </button>

          {hovering === true &&
          (locationAllowed !== true || isUsingVPN === true) ? (
            <div className="bg-white absolute text-sm rounded font-bold text-black right-0 bottom-0">
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
          className={`hidden md:flex flex-1	items-center justify-end h-full rounded-full cursor-pointer ${
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
      <Modal open={showOnboarding} onClose={() => setShowOnboarding(false)}>
        <OnBoardingModal />
      </Modal>
    </>
  );
});

export default AccountButton;
