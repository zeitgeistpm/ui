import { observer } from "mobx-react";
import React, { FC, useState } from "react";

import { Menu, Transition } from "@headlessui/react";
import { getWallets } from "@talismn/connect-wallets";
import Avatar from "components/ui/Avatar";
import Modal from "components/ui/Modal";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import { useAccountModals } from "lib/hooks/account";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useStore } from "lib/stores/Store";
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized, shortenAddress } from "lib/util";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { DollarSign, Frown, Settings, User } from "react-feather";
import OnBoardingModal from "./OnboardingModal";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { ZTG } from "@zeitgeistpm/sdk-next";
import { useBalance } from "lib/hooks/queries/useBalance";
import Decimal from "decimal.js";
import { useChainConstants } from "../../lib/hooks/queries/useChainConstants";

const BalanceRow = ({
  imgPath,
  balance,
  units,
}: {
  imgPath: string;
  balance: Decimal;
  units: string;
}) => {
  return (
    <div className="flex items-center mb-3 ">
      <img src={imgPath} height={"24px"} width="24px" />
      <div
        className={`group font-bold flex w-full items-center rounded-md px-2 py-2 text-sm`}
      >
        {balance &&
          `${formatNumberLocalized(
            balance?.div(ZTG).abs().toNumber(),
          )} ${units}`}
      </div>
    </div>
  );
};

const AccountButton: FC<{
  connectButtonClassname?: string;
  autoClose?: boolean;
  avatarDeps?: any[];
}> = observer(({ connectButtonClassname, autoClose, avatarDeps }) => {
  const store = useStore();
  const {
    connected,
    activeAccount,
    selectWallet,
    disconnectWallet,
    isNovaWallet,
  } = useWallet();
  const accountModals = useAccountModals();
  const { locationAllowed, isUsingVPN } = useUserLocation();
  const [hovering, setHovering] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGetZtgModal, setShowGetZtgModal] = useState(false);

  const { data: activeBalance } = useZtgBalance(activeAccount?.address);
  const { data: polkadotBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 0,
  });

  const { data: constants } = useChainConstants();

  const connect = async () => {
    if (isNovaWallet) {
      selectWallet("polkadot-js");
    } else {
      accountModals.openWalletSelect();
    }
  };

  const handleMouseEnter = () => {
    setHovering(true);
  };

  const handleMouseLeave = () => {
    setHovering(false);
  };

  const { pathname } = useRouter();

  const hasWallet =
    typeof window !== "undefined" &&
    getWallets().some(
      (wallet) =>
        wallet?.installed &&
        SUPPORTED_WALLET_NAMES.some(
          (walletName) => walletName === wallet.extensionName,
        ),
    );

  const handleOnboardingClick = () => {
    hasWallet ? connect() : setShowOnboarding(true);
  };

  return (
    <>
      {!connected ? (
        <div
          className="sm:mr-5 sm:ml-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={
              connectButtonClassname ||
              `flex border-2 rounded-full px-6 leading-[40px] ${
                pathname === "/"
                  ? "text-black border-black sm:text-white sm:bg-transparent sm:border-white"
                  : "text-black border-black"
              } rounded-full font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-30`
            }
            onClick={() => handleOnboardingClick()}
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
        <div className="relative sm:mr-5 sm:ml-auto">
          <Menu>
            {({ open }) => (
              <>
                <div>
                  <Menu.Button>
                    <div
                      className={`flex flex-1	items-center justify-end h-full rounded-full cursor-pointer ${
                        open
                          ? "border-orange-500"
                          : pathname === "/"
                          ? " border-white"
                          : "border-black"
                      }`}
                    >
                      <div
                        className={`flex items-center rounded-full h-full border-2 pl-1.5 ${
                          pathname === "/"
                            ? `bg-black text-white ${
                                open ? "border-orange-500" : "border-white"
                              }`
                            : `text-black ${
                                open ? "border-orange-500" : "border-black"
                              }`
                        }`}
                      >
                        <div
                          className={`border-1 ${
                            open ? "border-orange-500" : "border-transparent"
                          } rounded-full`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Avatar
                            zoomed
                            address={activeAccount?.address}
                            deps={avatarDeps}
                          />
                        </div>
                        <span
                          className={`font-medium px-3.5 text-sm h-full leading-[40px] ${
                            pathname === "/" ? "text-white" : "text-black"
                          }`}
                        >
                          {activeAccount &&
                            shortenAddress(activeAccount?.address, 6, 4)}
                        </span>
                      </div>
                    </div>
                  </Menu.Button>
                </div>

                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 py-3 z-40 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="">
                      <div className="border-b-2 mb-3 py-2">
                        <div className="px-4">
                          <BalanceRow
                            imgPath="/currencies/ztg.jpg"
                            units={constants?.tokenSymbol}
                            balance={activeBalance}
                          />
                        </div>
                        <div className="px-4">
                          <BalanceRow
                            imgPath="/currencies/dot.png"
                            units="DOT"
                            balance={polkadotBalance}
                          />
                        </div>
                        <div className="px-4">
                          <div className="flex items-center mb-3">
                            <img
                              src="/currencies/usdt.png"
                              height={"24px"}
                              width="24px"
                            />
                            <div className="bg-green-200 ml-2 text-green-900 rounded-md py-1 px-2 text-xs">
                              USDT Coming Soon!
                            </div>
                          </div>
                        </div>
                      </div>
                      <Menu.Item>
                        {({ active }) => (
                          <div
                            className="flex items-center px-4 mb-3 hover:bg-slate-100"
                            onClick={() => setShowGetZtgModal(true)}
                          >
                            <DollarSign />
                            <button
                              className={`group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              Get ZTG
                            </button>
                          </div>
                        )}
                      </Menu.Item>
                      {isNovaWallet !== true && (
                        <Menu.Item>
                          {({ active }) => (
                            <div
                              className="flex items-center px-4 mb-3 hover:bg-slate-100"
                              onClick={() => {
                                accountModals.openAccontSelect();
                              }}
                            >
                              <User />
                              <button
                                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                Select Account
                              </button>
                            </div>
                          )}
                        </Menu.Item>
                      )}
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/settings">
                            <div className="flex items-center px-4 mb-3 hover:bg-slate-100">
                              <Settings />
                              <button
                                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                Settings
                              </button>
                            </div>
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <div
                            className="flex items-center px-4 hover:bg-slate-100"
                            onClick={() => disconnectWallet()}
                          >
                            <Frown />
                            <button
                              className={`group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              Disconnect
                            </button>
                          </div>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        </div>
      )}
      <Modal open={showOnboarding} onClose={() => setShowOnboarding(false)}>
        <OnBoardingModal />
      </Modal>
      <Modal open={showGetZtgModal} onClose={() => setShowGetZtgModal(false)}>
        <OnBoardingModal step={4} />
      </Modal>
    </>
  );
});

export default dynamic(() => Promise.resolve(AccountButton), {
  ssr: false,
});
