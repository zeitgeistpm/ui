import { Menu, Popover, Transition } from "@headlessui/react";
import { getWallets } from "@talismn/connect-wallets";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { SUPPORTED_WALLET_NAMES, isNTT, nttID } from "lib/constants";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useAccountModals } from "lib/state/account";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useWallet, walletAtom } from "lib/state/wallet";
import { formatNumberLocalized, shortenAddress } from "lib/util";
import { FaNetworkWired } from "react-icons/fa";
import { useEffect, useMemo } from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import React, { FC, Fragment, PropsWithChildren, use, useState } from "react";
import {
  ArrowRight,
  BarChart,
  ChevronDown,
  DollarSign,
  Frown,
  Settings,
  User,
} from "react-feather";
import { useChainConstants } from "../../lib/hooks/queries/useChainConstants";
import {
  DesktopOnboardingModal,
  MobileOnboardingModal,
} from "./OnboardingModal";
import SettingsModal from "components/settings/SettingsModal";
import CopyIcon from "../ui/CopyIcon";
import { formatNumberCompact } from "lib/util/format-compact";
import useActiveBalance from "lib/state/useActiveBalance";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import { useRef } from "react";

const BalanceRow = ({
  imgPath,
  balance,
  units,
}: {
  imgPath: string;
  units?: string;
  balance?: Decimal;
}) => {
  return (
    <div className="flex items-center">
      <img src={imgPath} height={"24px"} width="24px" />
      <div
        className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-bold`}
      >
        {balance &&
          `${formatNumberLocalized(balance?.div(ZTG).abs().toNumber())} ${
            units ?? ""
          }`}
      </div>
    </div>
  );
};

const HeaderActionButton: FC<
  PropsWithChildren<{
    onClick: () => void;
    disabled: boolean;
  }>
> = ({ onClick, disabled, children }) => {
  return (
    <button
      className={`flex w-[185px] cursor-pointer items-center justify-center rounded-full border-2 border-white px-6 font-medium leading-[40px] text-white disabled:cursor-default disabled:opacity-30`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const AccountButton: FC<{
  connectButtonClassname?: string;
  autoClose?: boolean;
  avatarDeps?: any[];
}> = ({ connectButtonClassname, autoClose, avatarDeps }) => {
  const [sdk] = useSdkv2();
  const {
    connected,
    activeAccount,
    selectWallet,
    disconnectWallet,
    isNovaWallet,
    getProxyFor,
    realAddress,
    walletId,
  } = useWallet();
  const proxy = getProxyFor(activeAccount?.address);

  const accountModals = useAccountModals();
  const { locationAllowed, isUsingVPN } = useUserLocation();
  const [hovering, setHovering] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGetZtgModal, setShowGetZtgModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const confirm = useConfirmation();

  const { data: activeBalance } = useZtgBalance(activeAccount?.address);
  const { data: polkadotBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 0,
  });
  const { data: NTTBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: nttID,
  });

  const balance = useActiveBalance(activeAccount?.address, {
    ForeignAsset: nttID,
  });

  // console.log(balance?.div(ZTG).abs().toNumber());

  const { data: constants } = useChainConstants();

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const connect = async () => {
    if (isNTT) {
      selectWallet("web3auth");
      return;
    }
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

  return (
    <>
      {!connected ? (
        <div
          className="ml-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isNTT ? (
            <HeaderActionButton
              disabled={
                locationAllowed !== true || isUsingVPN || !isRpcSdk(sdk)
              }
              onClick={() => connect()}
            >
              Get Started
            </HeaderActionButton>
          ) : hasWallet === true ? (
            <HeaderActionButton
              disabled={
                locationAllowed !== true || isUsingVPN || !isRpcSdk(sdk)
              }
              onClick={() => connect()}
            >
              Connect Wallet
            </HeaderActionButton>
          ) : (
            <HeaderActionButton
              disabled={locationAllowed !== true || isUsingVPN}
              onClick={() => setShowOnboarding(true)}
            >
              Get Started
            </HeaderActionButton>
          )}

          {hovering === true &&
          (locationAllowed !== true || isUsingVPN === true) ? (
            <div className="absolute bottom-0 right-0 rounded bg-white text-sm font-bold text-black">
              {locationAllowed !== true
                ? "Your jurisdiction is not authorised to trade"
                : "Trading over a VPN is not allowed due to legal restrictions"}
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="relative ml-auto">
          <Menu>
            {({ open }) => (
              <>
                <div>
                  <div className="relative flex h-11">
                    <Menu.Button>
                      <div
                        className={`relative z-30 flex	h-full flex-1 cursor-pointer items-center justify-end rounded-full  ${
                          open
                            ? "border-orange-500"
                            : pathname === "/"
                              ? " border-white"
                              : "border-black"
                        }`}
                      >
                        <div
                          className={`flex h-full w-max items-center rounded-full border-2 bg-black py-1 pl-1.5 text-white transition-all md:py-0 ${
                            open ? "border-sunglow-2" : "border-white"
                          }`}
                        >
                          {!isNTT && (
                            <div className={`rounded-full ring-2`}>
                              {activeAccount?.address && (
                                <Avatar
                                  zoomed
                                  address={activeAccount?.address}
                                  deps={avatarDeps}
                                />
                              )}
                            </div>
                          )}
                          {isNTT ? (
                            <span className="hidden h-full min-w-fit pl-2 text-sm font-medium leading-[40px] transition-all md:block">
                              {formatNumberCompact(
                                balance?.div(ZTG).abs().toNumber() ?? 0,
                              )}{" "}
                              NTT
                            </span>
                          ) : (
                            <span
                              className={`hidden h-full pl-2 text-sm font-medium leading-[40px] transition-all md:block ${
                                open ? "text-sunglow-2" : "text-white"
                              }`}
                            >
                              {activeAccount &&
                                shortenAddress(activeAccount?.address, 6, 4)}
                            </span>
                          )}

                          <div className="pr-1">
                            <ChevronDown
                              size={16}
                              viewBox="4 3 16 16"
                              className={`box-content px-2 ${
                                open && "rotate-180 text-sunglow-2"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </Menu.Button>
                    {proxy && proxy.enabled && (
                      <Popover className={"relative"}>
                        {({ open }) => (
                          <>
                            <Popover.Button className="relative z-20 focus:outline-none">
                              <div
                                className={`z-rounded-r-full z-50 -ml-4 h-11 pl-6 ${
                                  open
                                    ? "bg-gradient-to-r from-purple-500 to-purple-500"
                                    : "bg-gradient-to-r from-purple-700 to-purple-500"
                                } center rounded-r-full pr-4 text-purple-900`}
                              >
                                <FaNetworkWired size={18} />
                              </div>
                            </Popover.Button>
                            <div className="z-10">
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 :scale-95"
                              >
                                <Popover.Panel className="absolute bottom-6 right-0 z-10 w-64 translate-y-[100%]">
                                  <div className="flex items-center">
                                    <div className="flex w-full items-center rounded-md rounded-tr-none bg-purple-500 p-4 pt-8">
                                      <div className="flex-1">
                                        <label className="mb-2 text-xs italic text-purple-900">
                                          Account is acting proxy for:
                                        </label>
                                        <div className="flex items-center gap-1">
                                          <div className="text-sm text-white">
                                            {realAddress &&
                                              shortenAddress(realAddress, 7, 7)}
                                          </div>
                                          <div className="text-purple-800">
                                            <CopyIcon
                                              size={14}
                                              copyText={realAddress}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Popover.Panel>
                              </Transition>
                            </div>
                          </>
                        )}
                      </Popover>
                    )}
                  </div>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                  enterTo="transform opacity-100 translate-y-0 md:scale-100"
                  leave="transition ease-in translate-y-2 md:translate-y-0 duration-75"
                  leaveFrom="transform opacity-100 translate-y-0 md:scale-100"
                  leaveTo="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                >
                  <Menu.Items className="fixed left-0 z-40 mt-3 h-full w-full origin-top-right divide-y divide-gray-100 overflow-hidden bg-white py-3 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none md:absolute md:left-auto md:right-0 md:mt-6 md:h-auto md:w-64 md:rounded-md">
                    <div className="">
                      <div className="mb-3 flex flex-col gap-2 border-b-2 px-6 py-2">
                        {isNTT ? (
                          <BalanceRow
                            imgPath="/currencies/NTT-currency.png"
                            units="NTT"
                            balance={balance}
                          />
                        ) : (
                          <>
                            <BalanceRow
                              imgPath="/currencies/ztg.jpg"
                              units={constants?.tokenSymbol}
                              balance={activeBalance}
                            />
                            <BalanceRow
                              imgPath="/currencies/dot.png"
                              units="DOT"
                              balance={polkadotBalance}
                            />
                          </>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`/portfolio/${realAddress}?mainTab=Balances`}
                              className="mt-3"
                            >
                              <div className="mb-3 flex items-center">
                                <div className="text-xs font-medium">
                                  Go to Balances
                                </div>
                                <ArrowRight
                                  size={14}
                                  className="ml-2 md:ml-auto"
                                />
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      {!isNTT && (
                        <Menu.Item>
                          {({ active }) => (
                            <div
                              className="mb-3 flex items-center px-6 hover:bg-slate-100"
                              onClick={() => setShowGetZtgModal(true)}
                            >
                              <DollarSign />
                              <button
                                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                              >
                                Get ZTG
                              </button>
                            </div>
                          )}
                        </Menu.Item>
                      )}
                      {/* TODO: disable when ready to launch */}
                      {isNovaWallet !== true && (
                        <Menu.Item>
                          {({ active }) => (
                            <div
                              className="mb-3 flex items-center px-6 hover:bg-slate-100"
                              onClick={() => {
                                accountModals.openAccountSelect();
                              }}
                            >
                              <User />
                              <button
                                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                              >
                                Select Account
                              </button>
                            </div>
                          )}
                        </Menu.Item>
                      )}
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={`/portfolio/${realAddress}`}>
                            <div className="mb-3 flex items-center px-6 hover:bg-slate-100">
                              <BarChart />
                              <button
                                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                              >
                                Portfolio
                              </button>
                            </div>
                          </Link>
                        )}
                      </Menu.Item>
                      {!isNTT && (
                        <Menu.Item>
                          {({ active }) => (
                            <div
                              className="mb-3 flex cursor-pointer items-center px-6 hover:bg-slate-100"
                              onClick={() => setShowSettingsModal(true)}
                            >
                              <Settings />
                              <button
                                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                              >
                                Settings
                              </button>
                            </div>
                          )}
                        </Menu.Item>
                      )}
                      <Menu.Item>
                        {({ active }) => (
                          <div
                            className="flex items-center px-6 hover:bg-slate-100"
                            onClick={() => {
                              disconnectWallet();
                            }}
                          >
                            <Frown />
                            <button
                              className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
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
      <SettingsModal
        open={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
        }}
      />
      {isMobileDevice ? (
        <Modal open={showOnboarding} onClose={() => setShowOnboarding(false)}>
          <MobileOnboardingModal />
        </Modal>
      ) : (
        <>
          <Modal open={showOnboarding} onClose={() => setShowOnboarding(false)}>
            <DesktopOnboardingModal />
          </Modal>
          <Modal
            open={showGetZtgModal}
            onClose={() => setShowGetZtgModal(false)}
          >
            <DesktopOnboardingModal step={4} />
          </Modal>
        </>
      )}
    </>
  );
};

export default AccountButton;
