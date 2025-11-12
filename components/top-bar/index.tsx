import { Fragment, Suspense, useState, useEffect, useRef } from "react";

import { Menu, Transition } from "@headlessui/react";
import {
  MarketFilter,
  MarketsOrderBy,
  MarketType,
} from "lib/types/market-filter";
import { CATEGORIES } from "components/front-page/PopularCategories";
import MenuLogo from "components/top-bar/MenuLogo";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Menu as MenuIcon,
  X as XIcon,
  Users,
  ChevronDown,
  TrendingUp,
  User,
} from "react-feather";
import {
  FiArrowLeft,
  FiArrowRight,
  FiGrid,
  FiStar,
  FiAward,
  FiPlusSquare,
  FiList,
} from "react-icons/fi";
import { MdShowChart, MdStackedLineChart } from "react-icons/md";
import { useCategoryCounts } from "lib/hooks/queries/useCategoryCounts";
import MarketSearch from "components/markets/MarketSearch";
import Modal from "components/ui/Modal";
import { DesktopOnboardingModal } from "components/account/OnboardingModal";
import Skeleton from "components/ui/Skeleton";
import { delay } from "lib/util/delay";
import { useWallet } from "lib/state/wallet";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useRouter } from "next/router";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useAccountModals } from "lib/state/account";
import { useAlerts } from "lib/state/alerts";
import Avatar from "components/ui/Avatar";
import { formatNumberLocalized, shortenAddress } from "lib/util";
import { ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { ArrowRight, BarChart, Bell, Settings, LogOut } from "react-feather";
import CopyIcon from "components/ui/CopyIcon";
import SettingsModal from "components/settings/SettingsModal";
import { NotificationsPanel } from "components/account/NotificationsPanel";
import { useMobileViewport } from "lib/hooks/useMobileViewport";
import { useSimpleScrollLock } from "lib/hooks/useSimpleScrollLock";
import { useHapticFeedback } from "lib/hooks/useHapticFeedback";

const AccountButton = dynamic(
  async () => {
    await delay(200);
    return import("../account/AccountButton");
  },
  {
    ssr: false,
    loading: () => (
      <div
        className="center flex h-[44px] w-[76px] rounded-full border-2 border-white bg-black py-1 pl-1.5 text-white transition-all md:w-[186px] md:py-0"
        // height={"44px"}
        // width={"186px"}
      >
        <div className="animate-pulzzzse text-xs">...</div>
      </div>
    ),
  },
);

const MarketFilterSelection = dynamic(
  () => import("../markets/market-filter"),
  {
    ssr: false,
  },
);

// Balance Row Component
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
    <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm transition-all hover:bg-white/15 md:gap-3 md:px-3 md:py-2.5">
      <img
        src={imgPath}
        className="h-8 w-8 shrink-0 rounded-full ring-2 ring-white/10 md:h-7 md:w-7"
      />
      <div
        className={`flex w-full items-center text-base font-semibold text-white/90 md:text-sm ${className}`}
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

// Mobile Account View Component
const MobileAccountView = ({
  onNavigate,
  onShowNotifications,
}: {
  onNavigate: () => void;
  onShowNotifications: () => void;
}) => {
  const {
    connected,
    activeAccount,
    disconnectWallet,
    isNovaWallet,
    realAddress,
    walletId,
  } = useWallet();
  const accountModals = useAccountModals();
  const { data: identity } = useIdentity(realAddress);
  const { data: activeBalance } = useZtgBalance(activeAccount?.address);
  const { data: polkadotBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 0,
  });
  const { data: usdcAssetHubBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 4,
  });
  const { data: constants } = useChainConstants();
  const { alerts } = useAlerts(realAddress);
  const hasNotifications = alerts.length > 0;
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Get display name: identity > wallet name > shortened address
  const displayName =
    identity?.displayName ||
    activeAccount?.name ||
    (activeAccount?.address ? shortenAddress(activeAccount.address, 6, 4) : "");

  const fullAddress = activeAccount?.address || "";

  if (!connected || !activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-base text-white/70">Not connected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Wallet Name and Address Header */}
      <div className="flex flex-col gap-3 border-b-2 border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {activeAccount?.address && (
            <Avatar zoomed address={activeAccount.address} />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-white">
              {displayName}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base text-white/70">
                {shortenAddress(fullAddress, 8, 8)}
              </span>
              <CopyIcon copyText={fullAddress} size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="flex flex-col gap-2 border-b-2 border-white/10 pb-4">
        <BalanceRow
          imgPath="/currencies/ztg.svg"
          units={constants?.tokenSymbol}
          balance={activeBalance}
        />
        <div className="flex flex-col gap-1">
            <BalanceRow
            imgPath="/currencies/usdc.svg"
            units="USDC"
            balance={usdcAssetHubBalance}
            className="text-sm"
          />
          <BalanceRow
            imgPath="/currencies/dot.png"
            units="DOT"
            balance={polkadotBalance}
            className="text-sm"
          />
        </div>
        <Link
          href={`/portfolio/${realAddress}?mainTab=Balances`}
          onClick={onNavigate}
        >
          <div className="group flex min-h-[48px] cursor-pointer items-center justify-between rounded-lg bg-white/10 px-4 py-3 transition-all hover:bg-white/20">
            <span className="text-base font-semibold text-white/90">
              View All Balances
            </span>
            <ArrowRight
              size={18}
              className="text-ztg-green-500 transition-transform group-hover:translate-x-1"
            />
          </div>
        </Link>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-2">
        {/* Notifications */}
        <button
          onClick={() => {
            onShowNotifications();
            onNavigate();
          }}
          className="group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-left transition-all hover:bg-white/20"
        >
          <div className="relative">
            <Bell className="text-ztg-green-500 transition-colors" size={20} />
            {hasNotifications && (
              <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ztg-green-500"></div>
            )}
          </div>
          <span className="flex-1 text-base font-medium">Notifications</span>
          {hasNotifications && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ztg-green-500/20 text-base font-semibold text-ztg-green-500">
              {alerts.length}
            </span>
          )}
        </button>

        {/* Select Account */}
        {isNovaWallet !== true && (
          <button
            onClick={() => {
              walletId === "web3auth"
                ? accountModals.openWalletSelect()
                : accountModals.openAccountSelect();
              onNavigate();
            }}
            className="group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-left transition-all hover:bg-white/20"
          >
            <User className="text-ztg-green-500 transition-colors" size={20} />
            <span className="flex-1 text-base font-medium">Select Account</span>
          </button>
        )}

        {/* Portfolio */}
        <Link href={`/portfolio/${realAddress}`} onClick={onNavigate}>
          <div className="group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg bg-white/10 px-4 py-3 transition-all hover:bg-white/20">
            <BarChart
              className="text-ztg-green-500 transition-colors"
              size={20}
            />
            <span className="flex-1 text-base font-medium">Portfolio</span>
          </div>
        </Link>

        {/* Settings */}
        <button
          onClick={() => {
            setShowSettingsModal(true);
            onNavigate();
          }}
          className="group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-left transition-all hover:bg-white/20"
        >
          <Settings
            className="text-ztg-green-500 transition-colors"
            size={20}
          />
          <span className="flex-1 text-base font-medium">Settings</span>
        </button>

        {/* Divider */}
        <div className="my-1.5 border-t-2 border-white/10"></div>

        {/* Disconnect */}
        <button
          onClick={() => {
            disconnectWallet();
            onNavigate();
          }}
          className="group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border-2 border-ztg-red-500/40 bg-ztg-red-900/30 px-4 py-3 text-left backdrop-blur-sm transition-all hover:border-ztg-red-500/60 hover:bg-ztg-red-900/50"
        >
          <LogOut className="text-ztg-red-400 transition-colors" size={20}           />
          <span className="flex-1 text-base font-medium">Disconnect</span>
        </button>
      </div>

      {/* Modals */}
      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};

const TopBar = () => {
  const router = useRouter();
  const topBarRef = useRef<HTMLDivElement>(null);
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuView, setMobileMenuView] = useState<
    "navigation" | "account"
  >("navigation");
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize mobile viewport handling
  useMobileViewport();

  // Initialize haptic feedback
  const { withHapticFeedback } = useHapticFeedback();

  // Hide QuickNav on markets list pages (they have their own filter system)
  const hideQuickNavOnPages = ["/markets", "/markets/favorites"];
  const showQuickNav = !hideQuickNavOnPages.includes(router.pathname);
  const showMarketFilters = hideQuickNavOnPages.includes(router.pathname);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useSimpleScrollLock(hamburgerMenuOpen && isMobile);

  const mainTopBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTopBarHeight = () => {
      if (topBarRef.current) {
        const totalHeight = topBarRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--top-bar-total-height",
          `${totalHeight}px`,
        );
      }

      if (mainTopBarRef.current) {
        const height = mainTopBarRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--top-bar-height",
          `${height}px`,
        );
      }
    };

    if (typeof window === "undefined") return;

    updateTopBarHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateTopBarHeight();
    });

    if (topBarRef.current) {
      resizeObserver.observe(topBarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [showQuickNav, showMarketFilters]);

  return (
    <div
      ref={topBarRef}
      id="top-bar-container"
      className={`fixed top-0 z-50 w-full shadow-lg transition-all duration-300`}
    >
      {/* Main TopBar */}
      <div
        ref={mainTopBarRef}
        className="relative bg-ztg-primary-500 py-2.5 backdrop-blur-md md:py-3"
      >
        <div className="container-fluid relative flex h-full items-center justify-between">
          <div className="hidden h-full items-center justify-center overflow-visible md:flex">
            <Link
              href="/"
              className="relative z-10 inline-flex cursor-pointer overflow-visible transition-opacity focus:outline-none"
              onClick={(e) => {
                // Ensure navigation happens
                e.stopPropagation();
              }}
            >
              <MenuLogo />
            </Link>
          </div>
          {/* Mobile: Logo, Search, Hamburger Menu */}
          <div className="flex w-full min-w-0 flex-1 items-center gap-2 md:hidden">
            <Link
              href="/"
              className="relative z-10 inline-flex max-w-[36px] shrink-0 cursor-pointer transition-opacity focus:outline-none"
              onClick={(e) => {
                // Ensure navigation happens
                e.stopPropagation();
              }}
            >
              <MenuLogo />
            </Link>
            <div className="min-w-0 flex-1">
              <MarketSearch />
            </div>
            <div className="shrink-0">
              <Menu as="div" className="relative inline-block text-left">
                {({ open, close }) => {
                  // Track menu open state
                  useEffect(() => {
                    setHamburgerMenuOpen(open);
                    // Reset to navigation view when menu closes
                    if (!open) {
                      setMobileMenuView("navigation");
                    }
                  }, [open]);

                  return (
                    <>
                      <Menu.Button
                        className={`relative flex h-11 min-w-[44px] touch-manipulation items-center justify-center rounded-lg border-2 px-3 text-white/90 shadow-md backdrop-blur-sm transition-all active:scale-95 ${
                          open
                            ? "border-white/30 bg-white/20 hover:border-white/40 hover:bg-white/30"
                            : "border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/20"
                        }`}
                        aria-label={
                          open
                            ? "Close navigation menu"
                            : "Open navigation menu"
                        }
                        aria-expanded={open}
                        aria-haspopup="true"
                      >
                        {open ? (
                          <XIcon className="h-5 w-5 text-white transition-transform" />
                        ) : (
                          <MenuIcon className="h-5 w-5 text-white/90 transition-transform" />
                        )}
                      </Menu.Button>
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
                          className="fixed left-0 right-0 z-[60] w-screen origin-top-right overflow-y-auto border-t-2 border-white/10 px-4 py-4 text-white shadow-2xl backdrop-blur-lg focus:outline-none md:absolute md:inset-auto md:left-auto md:right-0 md:top-auto md:mt-2 md:h-auto md:w-80 md:rounded-lg md:border-2 md:border-white/10 md:bg-ztg-primary-700/95 md:px-5 md:py-3 md:ring-2 md:ring-white/5"
                          style={{
                            top: "var(--top-bar-height, 50px)",
                            height:
                              "calc(var(--vh, 1vh) * 100 - var(--top-bar-height, 50px))",
                            backgroundColor: "#1a1e3b",
                            WebkitOverflowScrolling: "touch",
                            paddingBottom: "env(safe-area-inset-bottom, 20px)",
                            transform: "translateZ(0)", // Force hardware acceleration
                            willChange: "transform, opacity", // Optimize for animations
                          }}
                        >
                          {/* Toggle between Navigation and Account - Mobile Only */}
                          <div
                            className="mb-4 flex gap-2 border-b-2 border-white/10 pb-3 md:hidden"
                            role="tablist"
                          >
                            <button
                              onClick={() => setMobileMenuView("navigation")}
                              className={`min-h-[48px] flex-1 rounded-lg px-4 py-3 text-base font-semibold transition-all ${
                                mobileMenuView === "navigation"
                                  ? "bg-ztg-green-600 text-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/20"
                              }`}
                              role="tab"
                              aria-selected={mobileMenuView === "navigation"}
                              aria-controls="navigation-panel"
                              id="navigation-tab"
                            >
                              Navigation
                            </button>
                            <button
                              onClick={() => setMobileMenuView("account")}
                              className={`min-h-[48px] flex-1 rounded-lg px-4 py-3 text-base font-semibold transition-all ${
                                mobileMenuView === "account"
                                  ? "bg-ztg-green-600 text-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/20"
                              }`}
                              role="tab"
                              aria-selected={mobileMenuView === "account"}
                              aria-controls="account-panel"
                              id="account-tab"
                            >
                              Account
                            </button>
                          </div>

                          {/* Navigation View - Always show on desktop, conditionally on mobile */}
                          <div
                            className={`flex flex-col gap-1 md:gap-1.5 ${isMobile && mobileMenuView !== "navigation" ? "hidden" : ""}`}
                            role="tabpanel"
                            id="navigation-panel"
                            aria-labelledby="navigation-tab"
                          >
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/markets?status=Active&ordering=Newest&liquidityOnly=true"
                                  onClick={close}
                                >
                                  <button
                                    className={`group flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                      active ? "bg-white/20" : ""
                                    }`}
                                  >
                                    <div className="relative h-5 w-5 shrink-0 text-ztg-green-500 md:h-5 md:w-5">
                                      <FiGrid size={"100%"} />
                                    </div>
                                    <h3 className="text-base font-semibold text-white md:text-sm">
                                      All Markets
                                    </h3>
                                  </button>
                                </Link>
                              )}
                            </Menu.Item>

                            <div className="my-0.5 border-b-2 border-white/10 md:my-1"></div>

                            <CreateMarketMenuItem onSelect={close} />

                            <div className="my-0.5 border-b-2 border-white/10 md:my-1"></div>

                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true"
                                  onClick={close}
                                >
                                  <button
                                    className={`group flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                      active ? "bg-white/20" : ""
                                    }`}
                                  >
                                    <div className="relative h-5 w-5 shrink-0 text-ztg-green-500 md:h-5 md:w-5">
                                      <FiStar size={"100%"} />
                                    </div>
                                    <h3 className="text-base font-semibold text-white md:text-sm">
                                      Popular Markets
                                    </h3>
                                  </button>
                                </Link>
                              )}
                            </Menu.Item>

                            <div className="my-0.5 border-b-2 border-white/10 md:my-1"></div>

                            <CategoriesMenuItem onSelect={close} />

                            {process.env.NEXT_PUBLIC_SHOW_COURT === "true" && (
                              <>
                                <div className="my-0.5 border-b-2 border-white/10 md:my-1"></div>
                                <Menu.Item>
                                  {({ active }) => (
                                    <Link href="/court" onClick={close}>
                                      <button
                                        className={`group flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                          active ? "bg-white/20" : ""
                                        }`}
                                      >
                                        <div className="relative h-5 w-5 shrink-0 text-ztg-green-500 md:h-5 md:w-5">
                                          <Users size={"100%"} />
                                        </div>
                                        <h3 className="text-base font-semibold text-white md:text-sm">
                                          Court
                                        </h3>
                                      </button>
                                    </Link>
                                  )}
                                </Menu.Item>
                              </>
                            )}
                          </div>

                          {/* Account View - Mobile Only */}
                          {isMobile && mobileMenuView === "account" && (
                            <MobileAccountView
                              onNavigate={close}
                              onShowNotifications={() =>
                                setShowNotifications(true)
                              }
                            />
                          )}
                        </Menu.Items>
                      </Transition>
                    </>
                  );
                }}
              </Menu>
            </div>

            {/* Create Market Button - Removed (now in QuickNav) */}

            {/* <Link
            className="md:center relative hidden gap-2 font-light text-white md:flex"
            href="/leaderboard/year"
          >
            <div className="relative hidden flex-col items-center md:flex">
              <FiAward size="20px" />
              <div className="hidden text-xs md:block">Leaderboard</div>
            </div>
          </Link> */}
          </div>
          {/* Desktop: Layout */}
          <div className="hidden items-center justify-center gap-3 md:absolute md:left-0 md:right-0 md:mx-auto md:flex md:w-full md:max-w-screen-xl">
            {/* Desktop: Search in TopBar - Centered */}
            <div className="w-full max-w-sm md:max-w-md lg:max-w-xl">
              <MarketSearch />
            </div>
          </div>
          {/* Desktop: Account Button - Inside container-fluid, aligned to right edge */}
          <div className="hidden items-center md:flex">
            <AccountButton />
          </div>
        </div>
      </div>

      {/* QuickNav Section */}
      {showQuickNav && (
        <div className="relative -z-10 w-full border-t-2 border-white/5 bg-ztg-primary-500 shadow-md backdrop-blur-md">
          <div className="container-fluid relative w-full">
            <div className="relative flex items-center gap-1.5 overflow-x-auto py-2.5 sm:gap-2 md:gap-3 md:py-3">
              <Link
                href="/markets"
                className={`group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-3 sm:text-sm md:px-4 ${
                  router.pathname === "/markets" && !router.query.status
                    ? "bg-white/20 text-white ring-2 ring-ztg-green-500/50"
                    : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                }`}
              >
                <FiGrid
                  size={14}
                  className={`shrink-0 transition-colors sm:h-4 sm:w-4 ${
                    router.pathname === "/markets" && !router.query.status
                      ? "text-ztg-green-500"
                      : "text-ztg-green-500/80 group-hover:text-ztg-green-500"
                  }`}
                />
                <span className="whitespace-nowrap">All Markets</span>
              </Link>
              <Link
                href="/markets?status=Active&ordering=Newest&liquidityOnly=true"
                className={`group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-3 sm:text-sm md:px-4 ${
                  router.query.status === "Active" &&
                  router.query.ordering === "Newest"
                    ? "bg-white/20 text-white ring-2 ring-ztg-green-500/50"
                    : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                }`}
              >
                <TrendingUp
                  size={14}
                  className={`shrink-0 transition-colors sm:h-4 sm:w-4 ${
                    router.query.status === "Active" &&
                    router.query.ordering === "Newest"
                      ? "text-ztg-green-500"
                      : "text-ztg-green-500/80 group-hover:text-ztg-green-500"
                  }`}
                />
                <span className="whitespace-nowrap">Active</span>
              </Link>
              <Link
                href="/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true"
                className={`group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-3 sm:text-sm md:px-4 ${
                  router.query.status === "Active" &&
                  router.query.ordering === "Most Volume"
                    ? "bg-white/20 text-white ring-2 ring-ztg-green-500/50"
                    : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                }`}
              >
                <FiStar
                  size={14}
                  className={`shrink-0 transition-colors sm:h-4 sm:w-4 ${
                    router.query.status === "Active" &&
                    router.query.ordering === "Most Volume"
                      ? "text-ztg-green-500"
                      : "text-ztg-green-500/80 group-hover:text-ztg-green-500"
                  }`}
                />
                <span className="whitespace-nowrap">Trending</span>
              </Link>
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:hidden">
                <Menu as="div" className="relative">
                  {({ open }) => (
                    <>
                      <Menu.Button className="group flex shrink-0 items-center gap-1.5 rounded-lg bg-ztg-green-600/90 px-2.5 py-2 text-xs font-bold text-white shadow-md backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-lg active:scale-95 sm:gap-2 sm:px-3 sm:text-sm">
                        <FiPlusSquare
                          size={14}
                          className="hidden shrink-0 sm:inline sm:h-4 sm:w-4"
                        />
                        <span className="whitespace-nowrap font-bold">
                          Create Market
                        </span>
                        <ChevronDown
                          size={12}
                          className={`ml-0.5 shrink-0 transition-transform sm:h-3.5 sm:w-3.5 ${open ? "rotate-180" : ""}`}
                        />
                      </Menu.Button>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border-2 border-white/10 bg-ztg-primary-500/80 shadow-xl ring-2 ring-white/5 backdrop-blur-lg focus:outline-none">
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link href="/create">
                                  <button
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/90 transition-all ${
                                      active
                                        ? "bg-white/20 text-white shadow-sm"
                                        : ""
                                    }`}
                                  >
                                    <MdShowChart
                                      size={18}
                                      className="text-ztg-green-500"
                                    />
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold">
                                        Single Market
                                      </span>
                                    </div>
                                  </button>
                                </Link>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }) => (
                                <Link href="/create-combo">
                                  <button
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/90 transition-all ${
                                      active
                                        ? "bg-white/20 text-white shadow-sm"
                                        : ""
                                    }`}
                                  >
                                    <MdStackedLineChart
                                      size={18}
                                      className="text-ztg-green-500"
                                    />
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold">
                                        Combinatorial Market
                                      </span>
                                      <span className="text-xs text-white/70">
                                        Multi-outcome market
                                      </span>
                                    </div>
                                  </button>
                                </Link>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </div>
            </div>
            {/* Create Market Menu - positioned outside overflow container */}
            <div className="absolute right-0 top-0 hidden h-full items-center justify-end pr-4 md:pr-8 lg:pr-12 xl:pr-16 md:flex">
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <Menu.Button
                      className={`group flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 ${
                        open
                          ? "bg-white/15 text-white"
                          : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <FiPlusSquare
                        size={14}
                        className="hidden shrink-0 text-ztg-green-500 sm:inline sm:h-4 sm:w-4"
                      />
                      <span className="whitespace-nowrap">Create Market</span>
                      <ChevronDown
                        size={14}
                        className={`ml-0.5 shrink-0 transition-transform sm:h-4 sm:w-4 ${open ? "rotate-180" : ""}`}
                      />
                    </Menu.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border-2 border-white/10 bg-ztg-primary-500/80 shadow-xl ring-2 ring-white/5 backdrop-blur-lg focus:outline-none">
                        <div className="p-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link href="/create">
                                <button
                                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/90 transition-all ${
                                    active
                                      ? "bg-white/20 text-white shadow-sm"
                                      : ""
                                  }`}
                                >
                                  <MdShowChart
                                    size={18}
                                    className="text-ztg-green-500"
                                  />
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">
                                      Single Market
                                    </span>
                                  </div>
                                </button>
                              </Link>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <Link href="/create-combo">
                                <button
                                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/90 transition-all ${
                                    active
                                      ? "bg-white/20 text-white shadow-sm"
                                      : ""
                                  }`}
                                >
                                  <MdStackedLineChart
                                    size={18}
                                    className="text-ztg-green-500"
                                  />
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">
                                      Combinatorial Market
                                    </span>
                                    <span className="text-xs text-white/70">
                                      Multi-outcome market
                                    </span>
                                  </div>
                                </button>
                              </Link>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            </div>
          </div>
        </div>
      )}

      {/* Market Filters Section - shown only on markets pages */}
      {showMarketFilters && (
        <Suspense fallback={<div className="h-[50px]" />}>
          <MarketFilterSelectionWrapper />
        </Suspense>
      )}

      {/* Notifications Panel - rendered outside menus for proper mobile support */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

const MarketFilterSelectionWrapper = () => {
  const [filters, setFilters] = useState<MarketFilter[]>();
  const [orderBy, setOrderBy] = useState<MarketsOrderBy>();
  const [withLiquidityOnly, setWithLiquidityOnly] = useState<boolean>();
  const [marketType, setMarketType] = useState<MarketType>();

  return (
    <MarketFilterSelection
      onFiltersChange={setFilters}
      onOrderingChange={setOrderBy}
      onWithLiquidityOnlyChange={setWithLiquidityOnly}
      onMarketTypeChange={setMarketType}
    />
  );
};

const GetTokensButton = () => {
  const { activeAccount, connected } = useWallet();
  const { data: activeBalance } = useZtgBalance(activeAccount?.address);
  return (
    <>
      <Transition
        as={Fragment}
        show={true}
        enter="transition-all duration-250"
        enterFrom="opacity-0 scale-90"
        enterTo="opacity-100 scale-100"
        leave="transition-all duration-250"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-90"
      >
        <Link
          className="group relative hidden h-11 overflow-hidden rounded-md p-0.5 sm:block"
          href="/deposit"
        >
          <div
            className="absolute left-0 top-0 z-10 h-full w-full group-hover:-left-6 group-hover:-top-6 group-hover:h-[150%] group-hover:w-[150%] group-hover:animate-spin"
            style={{
              background:
                "linear-gradient(180deg, #FF00E6 0%, #F36464 50%, #04C3FF 100%)",
            }}
          />
          {/* <div className="relative z-20 block h-full sm:w-[125px] ">
            <button className="center h-full w-full rounded-md bg-black text-white">
              Get Tokens
            </button>
          </div> */}
        </Link>
      </Transition>
    </>
  );
};

const AirdropButton = () => {
  return (
    <Transition
      as={Fragment}
      show={true}
      enter="transition-all duration-250"
      enterFrom="opacity-0 scale-90"
      enterTo="opacity-100 scale-100"
      leave="transition-all duration-250"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-90"
    >
      <Link
        className="group relative hidden h-11 overflow-hidden rounded-md p-0.5 sm:block"
        href="/claim"
      >
        <div
          className="absolute left-0 top-0 z-10 h-full w-full group-hover:-left-6 group-hover:-top-6 group-hover:h-[150%] group-hover:w-[150%] group-hover:animate-spin"
          style={{
            background:
              "linear-gradient(180deg, #FF00E6 0%, #F36464 50%, #04C3FF 100%)",
          }}
        />
        {/* <div className="relative z-20 block h-full sm:w-[100px] ">
          <button className="center h-full w-full rounded-md bg-black text-white">
            Airdrop!
          </button>
        </div> */}
      </Link>
    </Transition>
  );
};

const CategoriesMenu = ({ onSelect }: { onSelect: () => void }) => {
  const { data: counts } = useCategoryCounts();

  const topCategories = CATEGORIES.map((category, index) => ({
    ...category,
    count: counts?.[index] ?? 0,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 9);

  return (
    <div className="grid grid-flow-row-dense grid-cols-2 gap-2 md:h-full md:grid-cols-3 md:gap-3">
      {topCategories.map((category, index) => (
        <Link
          key={index}
          onClick={onSelect}
          href={`/markets?status=Active&tag=${category.name}&ordering=Newest&liquidityOnly=true`}
          className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 md:pb-0"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 md:h-10 md:w-10">
            <Image
              src={category.imagePath}
              fill
              alt="Markets menu"
              sizes="100"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-base font-semibold text-white md:text-sm">
              {category.name}
            </div>
            <div className="h-[18px] text-sm font-light text-white/80 md:h-[16px] md:text-xs">
              {category.count}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const CreateMarketMenu = ({ onSelect }: { onSelect: () => void }) => {
  return (
    <div className="flex flex-col gap-1 md:gap-1.5">
      <Link
        onClick={onSelect}
        href="/create"
        className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-ztg-green-500 md:h-10 md:w-10">
          <MdShowChart size={20} className="md:h-5 md:w-5" />
        </div>
        <div className="flex flex-col">
          <div className="text-base font-semibold text-white md:text-sm">
            Single Market
          </div>
        </div>
      </Link>

      <Link
        onClick={onSelect}
        href="/create-combo"
        className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-ztg-green-500 md:h-10 md:w-10">
          <MdStackedLineChart size={20} className="md:h-5 md:w-5" />
        </div>
        <div className="flex flex-col">
          <div className="text-base font-semibold text-white md:text-sm">
            Combinatorial Market
          </div>
          <div className="text-sm font-light text-white/80 md:text-xs">
            Create a complex multi-outcome market
          </div>
        </div>
      </Link>
    </div>
  );
};

const CategoriesMenuItem = ({ onSelect }: { onSelect: () => void }) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when categories submenu is open on mobile
  useSimpleScrollLock(categoriesOpen && isMobile);

  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
              active ? "bg-white/20" : ""
            }`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCategoriesOpen(!categoriesOpen);
            }}
          >
            <div className="relative h-5 w-5 shrink-0 text-ztg-green-500 md:h-5 md:w-5">
              <FiList size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-base font-semibold text-white md:text-sm">
              Categories
            </h3>
            <FiArrowRight
              size={20}
              className="shrink-0 text-white md:h-[18px] md:w-[18px]"
            />
          </button>
        )}
      </Menu.Item>

      <Transition
        as={Fragment}
        show={categoriesOpen}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 translate-x-6 md:scale-95"
        enterTo="transform opacity-100 translate-x-0 md:scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 translate-x-0 md:scale-100"
        leaveTo="transform opacity-0 translate-x-6 md:scale-95"
      >
        <div
          className="fixed bottom-0 left-0 right-0 z-[130] w-screen origin-top-right overflow-y-auto border-t-2 border-white/10 px-4 py-4 shadow-2xl backdrop-blur-lg focus:outline-none md:absolute md:inset-auto md:-right-4 md:left-auto md:ml-4 md:h-auto md:w-[600px] md:translate-x-[100%] md:rounded-lg md:border-2 md:border-white/10 md:bg-ztg-primary-700/95 md:px-5 md:py-3 md:ring-2 md:ring-white/5"
          style={{
            top: "calc(var(--top-bar-height, 50px) + 20px)",
            height:
              "calc(var(--vh, 1vh) * 100 - var(--top-bar-height, 50px) - 20px)",
            backgroundColor: "#1a1e3b",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "env(safe-area-inset-bottom, 20px)",
            transform: "translateZ(0)", // Force hardware acceleration
            willChange: "transform, opacity", // Optimize for animations
          }}
        >
          <div
            className="mb-3 flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-all hover:bg-white/20 md:hidden"
            onClick={() => setCategoriesOpen(false)}
          >
            <FiArrowLeft size={20} className="text-white" />
            <span className="text-base font-semibold text-white">
              Back to Menu
            </span>
          </div>
          <CategoriesMenu onSelect={onSelect} />
        </div>
      </Transition>
    </>
  );
};

const CreateMarketMenuItem = ({ onSelect }: { onSelect: () => void }) => {
  const [createMarketOpen, setCreateMarketOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when create market submenu is open on mobile
  useSimpleScrollLock(createMarketOpen && isMobile);

  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-white transition-all hover:bg-white/20 md:min-h-0 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
              active ? "bg-white/20" : ""
            }`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCreateMarketOpen(!createMarketOpen);
            }}
          >
            <div className="relative h-5 w-5 shrink-0 text-ztg-green-500 md:h-5 md:w-5">
              <FiPlusSquare size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-base font-semibold text-white md:text-sm">
              Create Market
            </h3>
            <FiArrowRight
              size={20}
              className="shrink-0 text-white md:h-[18px] md:w-[18px]"
            />
          </button>
        )}
      </Menu.Item>

      <Transition
        as={Fragment}
        show={createMarketOpen}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 translate-x-6 md:scale-95"
        enterTo="transform opacity-100 translate-x-0 md:scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 translate-x-0 md:scale-100"
        leaveTo="transform opacity-0 translate-x-6 md:scale-95"
      >
        <div
          className="fixed bottom-0 left-0 right-0 z-[130] w-screen origin-top-right overflow-y-auto border-t-2 border-white/10 px-4 py-4 shadow-2xl backdrop-blur-lg focus:outline-none md:absolute md:inset-auto md:-right-4 md:left-auto md:ml-4 md:h-auto md:w-[400px] md:translate-x-[100%] md:rounded-lg md:border-2 md:border-white/10 md:bg-ztg-primary-700/95 md:px-5 md:py-3 md:ring-2 md:ring-white/5"
          style={{
            top: "calc(var(--top-bar-height, 50px) + 20px)",
            height:
              "calc(var(--vh, 1vh) * 100 - var(--top-bar-height, 50px) - 20px)",
            backgroundColor: "#1a1e3b",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "env(safe-area-inset-bottom, 20px)",
            transform: "translateZ(0)", // Force hardware acceleration
            willChange: "transform, opacity", // Optimize for animations
          }}
        >
          <div
            className="mb-3 flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-all hover:bg-white/20 md:hidden"
            onClick={() => setCreateMarketOpen(false)}
          >
            <FiArrowLeft size={20} className="text-white" />
            <span className="text-base font-semibold text-white">
              Back to Menu
            </span>
          </div>
          <CreateMarketMenu onSelect={onSelect} />
        </div>
      </Transition>
    </>
  );
};

export default TopBar;
