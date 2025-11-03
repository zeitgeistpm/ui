import { Menu, Popover, Transition } from "@headlessui/react";
import { getWallets } from "@talismn/connect-wallets";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useAccountModals } from "lib/state/account";
import { useUserLocation } from "lib/hooks/useUserLocation";
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized, shortenAddress } from "lib/util";
import { FaNetworkWired } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  FC,
  Fragment,
  PropsWithChildren,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  ArrowRight,
  BarChart,
  Bell,
  ChevronDown,
  DollarSign,
  LogOut,
  Settings,
  User,
  X,
} from "react-feather";
import { useChainConstants } from "../../lib/hooks/queries/useChainConstants";
import { DesktopOnboardingModal } from "./OnboardingModal";
import SettingsModal from "components/settings/SettingsModal";
import CopyIcon from "../ui/CopyIcon";
import { useAlerts, Alert } from "lib/state/alerts";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { NotificationsPanel } from "./NotificationsPanel";
import { useSimpleScrollLock } from "lib/hooks/useSimpleScrollLock";

const BalanceRow = ({
  imgPath,
  balance,
  units,
  className,
}: {
  imgPath: string;
  units?: string;
  balance?: Decimal;
  className?: string;
}) => {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2 backdrop-blur-sm transition-all hover:bg-white/15 md:gap-3 md:px-3 md:py-2.5">
      <img
        src={imgPath}
        className="h-6 w-6 shrink-0 rounded-full ring-2 ring-white/10 md:h-7 md:w-7"
      />
      <div
        className={`flex w-full items-center text-xs font-semibold text-white/90 md:text-sm ${className}`}
      >
        {balance &&
          `${formatNumberLocalized(balance?.div(ZTG).abs().toNumber())} ${
            units ?? ""
          }`}
        {!balance && <span className="text-white/50">---</span>}
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
      className={`flex w-[185px] cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-white/10 px-6 font-semibold leading-[40px] text-white shadow-md backdrop-blur-lg transition-all hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-ztg-green-500/10 disabled:cursor-default disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-white/10 disabled:hover:shadow-md`}
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
  const { locationAllowed } = useUserLocation();
  const router = useRouter();
  const [hovering, setHovering] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGetZtgModal, setShowGetZtgModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { alerts } = useAlerts(realAddress);
  const hasNotifications = alerts.length > 0;

  const { data: identity } = useIdentity(realAddress);
  const { data: activeBalance } = useZtgBalance(activeAccount?.address);

  const { data: polkadotBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 0,
  });
  const { data: usdcAssetHubBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 4,
  });
  const { data: usdcMoonbeamBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 1,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    right: number;
    top: number;
  } | null>(null);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        right: window.innerWidth - rect.right,
        top: rect.bottom,
      });
    }
  };

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when account menu is open on mobile
  useSimpleScrollLock(accountMenuOpen && isMobile);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

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
          {hasWallet === true ? (
            <HeaderActionButton
              disabled={locationAllowed !== true || !isRpcSdk(sdk)}
              onClick={() => connect()}
            >
              Connect Wallet
            </HeaderActionButton>
          ) : (
            <HeaderActionButton
              disabled={locationAllowed !== true}
              onClick={() => setShowOnboarding(true)}
            >
              Get Started
            </HeaderActionButton>
          )}

          {hovering === true && locationAllowed !== true ? (
            <div className="absolute bottom-0 right-0 rounded-lg border-2 border-ztg-red-500/40 bg-ztg-red-500/20 px-3 py-2 text-sm font-semibold text-white/90 shadow-md backdrop-blur-sm">
              Your jurisdiction is not authorised to trade
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="relative z-[110] shrink-0" ref={containerRef}>
          <Menu>
            {({ open, close }) => {
              // Track menu open state for scroll locking
              useEffect(() => {
                setAccountMenuOpen(open);
              }, [open]);

              // Update position when menu opens
              if (open) {
                setTimeout(() => updatePosition(), 0);
              }

              return (
                <>
                  <div className="w-full max-w-[200px] md:max-w-[200px]">
                    <div className="relative flex h-11 w-full overflow-hidden md:h-11 md:w-full md:shrink-0">
                      <Menu.Button className="w-full md:w-full md:shrink-0">
                        <div className="relative z-[110] flex h-full w-full min-w-0 cursor-pointer items-center rounded-full md:w-full md:shrink-0">
                          <div
                            className={`flex h-full w-full min-w-0 items-center justify-center gap-2 rounded-full border-2 bg-white/10 px-3 py-2 text-white shadow-md backdrop-blur-lg transition-all hover:border-white/30 hover:bg-white/15 hover:shadow-lg md:min-w-0 md:shrink-0 md:gap-2.5 md:px-3 md:py-2 ${
                              open
                                ? "border-ztg-green-500/60 bg-white/15 shadow-lg shadow-ztg-green-500/10 ring-2 ring-ztg-green-500/20"
                                : "border-white/20"
                            }`}
                          >
                            <div className="relative flex shrink-0 items-center">
                              {activeAccount?.address && (
                                <Avatar
                                  zoomed
                                  address={activeAccount?.address}
                                  deps={avatarDeps}
                                />
                              )}
                              {hasNotifications && (
                                <div className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse-scale rounded-full border-2 border-ztg-primary-700 bg-ztg-green-500 shadow-sm shadow-ztg-green-500/50 md:h-3 md:w-3"></div>
                              )}
                            </div>
                            <span
                              className={`flex min-w-0 flex-1 items-center justify-center overflow-hidden text-center text-sm font-semibold transition-all md:min-w-0 md:whitespace-nowrap md:text-center md:text-sm ${
                                open ? "text-ztg-green-400" : "text-white"
                              }`}
                              title={
                                (() => {
                                  // Priority: 1. On-chain identity, 2. Wallet account name, 3. Full address
                                  return (
                                    identity?.displayName ||
                                    activeAccount?.name ||
                                    activeAccount?.address ||
                                    ""
                                  );
                                })() || activeAccount?.address
                              }
                            >
                              <span className="block w-full truncate text-center">
                                {(() => {
                                  // Priority: 1. On-chain identity, 2. Wallet account name, 3. Shortened address
                                  const displayName =
                                    identity?.displayName ||
                                    activeAccount?.name ||
                                    (activeAccount?.address
                                      ? shortenAddress(
                                          activeAccount.address,
                                          6,
                                          4,
                                        )
                                      : "");
                                  return displayName;
                                })()}
                              </span>
                            </span>
                            <div className="shrink-0">
                              <ChevronDown
                                size={20}
                                className={`h-5 w-5 transition-all duration-200 md:h-4 md:w-4 ${
                                  open
                                    ? "rotate-180 text-ztg-green-400"
                                    : "text-white/90"
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
                                                shortenAddress(
                                                  realAddress,
                                                  7,
                                                  7,
                                                )}
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
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                    enterTo="transform opacity-100 translate-y-0 md:scale-100"
                    leave="transition ease-in duration-150"
                    leaveFrom="transform opacity-100 translate-y-0 md:scale-100"
                    leaveTo="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                  >
                    <Menu.Items
                      className="fixed left-0 right-0 z-[120] w-screen origin-top-right border-t-2 border-white/10 px-4 py-4 shadow-2xl backdrop-blur-lg focus:outline-none md:fixed md:inset-auto md:left-auto md:mt-2 md:h-auto md:max-h-[calc(100vh-100px)] md:w-80 md:overflow-visible md:rounded-lg md:border-2 md:border-white/10 md:bg-ztg-primary-700/95 md:px-0 md:pb-3 md:pt-3 md:shadow-2xl md:ring-2 md:ring-white/5 md:backdrop-blur-lg"
                      style={
                        dropdownPosition
                          ? {
                              right: isMobile
                                ? 0
                                : `${dropdownPosition.right}px`,
                              left: isMobile ? 0 : undefined,
                              top: isMobile ? 0 : `${dropdownPosition.top}px`,
                              height: isMobile ? "100vh" : undefined,
                              maxHeight: isMobile ? "100vh" : undefined,
                              backgroundColor: isMobile ? "#1a1e3b" : undefined,
                              overflowY: isMobile ? "auto" : undefined,
                            }
                          : undefined
                      }
                    >
                      <div className="flex h-full flex-col">
                        {/* Close button for mobile */}
                        {isMobile && (
                          <div className="mb-4 flex shrink-0 items-center justify-between border-b-2 border-white/10 px-4 pb-3">
                            <span className="text-base font-semibold text-white">
                              Account
                            </span>
                            <button
                              onClick={close}
                              className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        )}
                        <div className="flex-1 overflow-y-auto pb-4 md:pb-0">
                          <div
                            className={`mb-3 flex flex-col gap-2 border-b-2 border-white/10 px-4 py-3 md:mb-2 md:gap-3 md:px-5 md:py-3`}
                          >
                            <BalanceRow
                              imgPath="/currencies/ztg.jpg"
                              units={constants?.tokenSymbol}
                              balance={activeBalance}
                            />
                            <div className="flex flex-col gap-1 md:gap-1.5">
                              <BalanceRow
                                imgPath="/currencies/usdc.svg"
                                units="USDC"
                                balance={usdcAssetHubBalance}
                                className="text-[10px] md:text-xs"
                              />
                              {/* DISABLED: USDC.wh temporarily disabled */}
                              {/* <BalanceRow
                            imgPath="/currencies/usdc.svg"
                            units="USDC.wh"
                            balance={usdcMoonbeamBalance}
                            className="text-[10px] md:text-xs"
                          /> */}
                              <BalanceRow
                                imgPath="/currencies/dot.png"
                                units="DOT"
                                balance={polkadotBalance}
                                className="text-[10px] md:text-xs"
                              />
                            </div>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href={`/portfolio/${realAddress}?mainTab=Balances`}
                                  className="mt-1"
                                >
                                  <div
                                    className={`group flex min-h-[48px] cursor-pointer touch-manipulation items-center justify-between rounded-lg px-3 py-3 transition-all md:min-h-0 md:px-3 md:py-2.5 ${
                                      active
                                        ? "bg-white/20 shadow-sm"
                                        : "bg-white/10 hover:bg-white/20"
                                    }`}
                                  >
                                    <span className="text-sm font-semibold text-white/90 md:text-sm">
                                      View All Balances
                                    </span>
                                    <ArrowRight
                                      size={20}
                                      className="h-5 w-5 text-ztg-green-400 transition-transform group-hover:translate-x-1 md:h-4 md:w-4"
                                    />
                                  </div>
                                </Link>
                              )}
                            </Menu.Item>
                          </div>
                          {/* <Menu.Item>
                        {({ active }) => (
                          <div
                            className="mb-3 flex items-center px-6 hover:bg-ztg-primary-100"
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
                      </Menu.Item> */}
                          <div
                            className={`flex flex-col gap-1 px-4 py-2 md:gap-1.5 md:px-5 md:py-2`}
                          >
                            {/* Notifications Section */}
                            <Menu.Item>
                              {({ active }) => (
                                <div
                                  className={`group flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-white/90 transition-all md:min-h-0 md:gap-3 md:px-3 md:py-2.5 ${
                                    active
                                      ? "bg-white/20 shadow-sm"
                                      : "hover:bg-white/20"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowNotifications(true);
                                    close();
                                  }}
                                >
                                  <div className="relative">
                                    <Bell
                                      className="text-ztg-green-400 transition-colors"
                                      size={20}
                                    />
                                    {hasNotifications && (
                                      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ztg-green-500 md:-right-1 md:-top-1 md:h-2 md:w-2"></div>
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm font-medium md:text-sm">
                                    Notifications
                                  </span>
                                  {hasNotifications && (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ztg-green-500/20 text-xs font-semibold text-ztg-green-400 md:h-8 md:w-8 md:text-xs">
                                      {alerts.length}
                                    </span>
                                  )}
                                </div>
                              )}
                            </Menu.Item>

                            {isNovaWallet !== true && (
                              <Menu.Item>
                                {({ active }) => (
                                  <div
                                    className={`group flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-white/90 transition-all md:min-h-0 md:gap-3 md:px-3 md:py-2.5 ${
                                      active
                                        ? "bg-white/20 shadow-sm"
                                        : "hover:bg-white/20"
                                    }`}
                                    onClick={() => {
                                      walletId === "web3auth"
                                        ? accountModals.openWalletSelect()
                                        : accountModals.openAccountSelect();
                                      close();
                                    }}
                                  >
                                    <User
                                      className="text-ztg-green-400 transition-colors"
                                      size={20}
                                    />
                                    <span className="text-sm font-medium md:text-sm">
                                      Select Account
                                    </span>
                                  </div>
                                )}
                              </Menu.Item>
                            )}
                            <Menu.Item>
                              {({ active }) => (
                                <Link href={`/portfolio/${realAddress}`}>
                                  <div
                                    className={`group flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-white/90 transition-all md:min-h-0 md:gap-3 md:px-3 md:py-2.5 ${
                                      active
                                        ? "bg-white/20 shadow-sm"
                                        : "hover:bg-white/20"
                                    }`}
                                  >
                                    <BarChart
                                      className="text-ztg-green-400 transition-colors"
                                      size={20}
                                    />
                                    <span className="text-sm font-medium md:text-sm">
                                      Portfolio
                                    </span>
                                  </div>
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <div
                                  className={`group flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-white/90 transition-all md:min-h-0 md:gap-3 md:px-3 md:py-2.5 ${
                                    active
                                      ? "bg-white/20 shadow-sm"
                                      : "hover:bg-white/20"
                                  }`}
                                  onClick={() => {
                                    setShowSettingsModal(true);
                                    close();
                                  }}
                                >
                                  <Settings
                                    className="text-ztg-green-400 transition-colors"
                                    size={20}
                                  />
                                  <span className="text-sm font-medium md:text-sm">
                                    Settings
                                  </span>
                                </div>
                              )}
                            </Menu.Item>

                            {/* Divider before disconnect */}
                            <div className="my-1.5 border-t-2 border-white/10 md:my-2"></div>

                            <Menu.Item>
                              {({ active }) => (
                                <div
                                  className={`group flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-lg border-2 border-ztg-red-500/40 bg-ztg-red-900/30 px-3 py-3 text-white/90 backdrop-blur-sm transition-all hover:border-ztg-red-500/60 hover:bg-ztg-red-900/50 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 ${
                                    active ? "ring-2 ring-ztg-red-500/30" : ""
                                  }`}
                                  onClick={() => {
                                    disconnectWallet();
                                  }}
                                >
                                  <LogOut
                                    className="text-ztg-red-400 transition-colors"
                                    size={20}
                                  />
                                  <span className="text-sm font-medium md:text-sm">
                                    Disconnect
                                  </span>
                                </div>
                              )}
                            </Menu.Item>
                          </div>
                        </div>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              );
            }}
          </Menu>
        </div>
      )}
      <SettingsModal
        open={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
        }}
      />
      <>
        <Modal open={showOnboarding} onClose={() => setShowOnboarding(false)}>
          <DesktopOnboardingModal />
        </Modal>
        <Modal open={showGetZtgModal} onClose={() => setShowGetZtgModal(false)}>
          <DesktopOnboardingModal step={4} />
        </Modal>
        <NotificationsPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </>
    </>
  );
};

const NotificationItem = ({
  alert,
  realAddress,
  onNavigate,
}: {
  alert: Alert;
  realAddress?: string;
  onNavigate: () => void;
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (alert.type === "ready-to-report-market" && alert.market?.marketId) {
      router.push(`/markets/${alert.market.marketId}`);
    } else if (alert.type === "redeemable-markets") {
      router.push(`/portfolio/${realAddress}`);
    } else if (
      (alert.type === "court-case-ready-for-vote" ||
        alert.type === "court-case-ready-for-reveal" ||
        alert.type === "court-case-ready-to-settle") &&
      alert.caseId
    ) {
      router.push(`/court/${alert.caseId}`);
    }
    onNavigate();
  };

  const getLabel = () => {
    if (alert.type === "ready-to-report-market") return "Ready to Report";
    if (alert.type === "redeemable-markets")
      return `${alert.markets?.length ?? 0} Redeemable Markets`;
    if (alert.type === "court-case-ready-for-vote") return "Ready for Vote";
    if (alert.type === "court-case-ready-for-reveal") return "Ready to Reveal";
    if (alert.type === "court-case-ready-to-settle") return "Ready to Settle";
    return "Notification";
  };

  const getDescription = () => {
    if (alert.type === "ready-to-report-market") {
      return alert.market?.question;
    }
    return null;
  };

  return (
    <div
      className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 transition-all hover:border-white/20 hover:bg-white/10 md:px-3"
      onClick={handleClick}
    >
      <div className="text-xs font-semibold text-white/90 md:text-sm">
        {getLabel()}
      </div>
      {getDescription() && (
        <div className="mt-0.5 line-clamp-2 text-[10px] text-white/70 md:text-xs">
          {getDescription()}
        </div>
      )}
    </div>
  );
};

export default AccountButton;
