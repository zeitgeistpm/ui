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
import { MdFavoriteBorder } from "react-icons/md";
import { useRouter } from "next/router";

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

const TopBar = () => {
  const router = useRouter();
  const topBarRef = useRef<HTMLDivElement>(null);
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Lock body scroll when menus are open on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const hasOpenMenu = hamburgerMenuOpen;
    
    if (hasOpenMenu && isMobile) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [hamburgerMenuOpen, isMobile]);

  // Set CSS variable for top-bar height so mobile menus can position correctly
  const mainTopBarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateTopBarHeight = () => {
      // For mobile hamburger menu, only use main top bar height (not including filters)
      if (mainTopBarRef.current) {
        const height = mainTopBarRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--top-bar-height",
          `${height}px`,
        );
      }
    };

    updateTopBarHeight();
    window.addEventListener("resize", updateTopBarHeight);

    return () => window.removeEventListener("resize", updateTopBarHeight);
  }, [showQuickNav, showMarketFilters]);

  return (
    <div
      ref={topBarRef}
      id="top-bar-container"
      className={`fixed top-0 z-50 w-full shadow-lg transition-all duration-300`}
    >
      {/* Main TopBar */}
      <div ref={mainTopBarRef} className="relative bg-ztg-primary-500 py-2.5 backdrop-blur-md md:py-3">
        <div className="container-fluid relative flex h-full items-center justify-between">
          <div className="hidden h-full items-center justify-center md:flex overflow-visible">
            <Link 
              href="/" 
              className="relative z-10 inline-flex cursor-pointer transition-opacity focus:outline-none overflow-visible"
              onClick={(e) => {
                // Ensure navigation happens
                e.stopPropagation();
              }}
            >
              <MenuLogo />
            </Link>
          </div>
          {/* Mobile: Logo, Search, Hamburger Menu */}
          <div className="flex flex-1 items-center gap-2 md:hidden min-w-0 w-full">
            <Link 
              href="/" 
              className="relative z-10 inline-flex shrink-0 cursor-pointer transition-opacity focus:outline-none max-w-[36px]"
              onClick={(e) => {
                // Ensure navigation happens
                e.stopPropagation();
              }}
            >
              <MenuLogo />
            </Link>
            <div className="flex-1 min-w-0">
              <MarketSearch />
            </div>
            <div className="shrink-0">
            <Menu
              as="div"
              className="relative inline-block text-left"
            >
              {({ open, close }) => {
                // Track menu open state
                useEffect(() => {
                  setHamburgerMenuOpen(open);
                }, [open]);

                return (
                  <>
                    <Menu.Button className={`relative flex h-9 items-center justify-center rounded-lg border-2 px-3 text-white/90 shadow-md backdrop-blur-sm transition-all active:scale-95 touch-manipulation ${
                      open
                        ? "border-white/30 bg-white/20 hover:border-white/40 hover:bg-white/30"
                        : "border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/20"
                    }`}>
                      {open ? (
                        <XIcon className="h-4.5 w-4.5 text-white transition-transform" />
                      ) : (
                        <MenuIcon className="h-4.5 w-4.5 text-white/90 transition-transform" />
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
                          height: "calc(100vh - var(--top-bar-height, 50px))",
                          backgroundColor: "#1a1e3b",
                        }}
                      >
                        {/* Account Button in Hamburger Menu - Mobile Only */}
                        <div className="mb-4 md:hidden">
                          <AccountButton />
                        </div>
                        <div className="mb-3 border-b-2 border-white/10 md:hidden"></div>
                        
                        <div className="flex flex-col gap-1 md:gap-1.5">
                          <Menu.Item>
                            {({ active, close }) => (
                              <Link
                                href="/markets?status=Active&ordering=Newest&liquidityOnly=true"
                                onClick={close}
                              >
                                <button
                                  className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                    active ? "bg-white/20" : ""
                                  }`}
                                >
                                  <div className="relative h-4 w-4 shrink-0 text-ztg-green-400 md:h-5 md:w-5">
                                    <FiGrid size={"100%"} />
                                  </div>
                                  <h3 className="text-xs font-semibold text-white md:text-sm">
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
                            {({ active, close }) => (
                              <Link
                                href="/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true"
                                onClick={close}
                              >
                                <button
                                  className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                    active ? "bg-white/20" : ""
                                  }`}
                                >
                                  <div className="relative h-4 w-4 shrink-0 text-ztg-green-400 md:h-5 md:w-5">
                                    <FiStar size={"100%"} />
                                  </div>
                                  <h3 className="text-xs font-semibold text-white md:text-sm">
                                    Popular Markets
                                  </h3>
                                </button>
                              </Link>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active, close }) => (
                              <Link href="/markets/favorites" onClick={close}>
                                <button
                                  className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                    active ? "bg-white/20" : ""
                                  }`}
                                >
                                  <div className="relative h-4 w-4 shrink-0 text-ztg-green-400 md:h-5 md:w-5">
                                    <MdFavoriteBorder size={"100%"} />
                                  </div>
                                  <h3 className="text-xs font-semibold text-white md:text-sm">
                                    Favorites
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
                                {({ active, close }) => (
                                  <Link href="/court" onClick={close}>
                                    <button
                                      className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
                                        active ? "bg-white/20" : ""
                                      }`}
                                    >
                                      <div className="relative h-4 w-4 shrink-0 text-ztg-green-400 md:h-5 md:w-5">
                                        <Users size={"100%"} />
                                      </div>
                                      <h3 className="text-xs font-semibold text-white md:text-sm">
                                        Court
                                      </h3>
                                    </button>
                                  </Link>
                                )}
                              </Menu.Item>
                            </>
                          )}
                        </div>

                        {/* <div className="block md:hidden">
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/leaderboard/year" onClick={close}>
                              <button
                                className={`group mb-4 flex w-full  items-center gap-3 px-2 py-2 text-sm`}
                              >
                                <div className="relative h-6 w-6">
                                  <FiAward size={"100%"} />
                                </div>
                                <h3 className="text-sm font-semibold">
                                  Leaderboard
                                </h3>
                              </button>
                            </Link>
                          )}
                        </Menu.Item>
                      </div> */}
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
          <div className="hidden items-center justify-center gap-3 md:flex md:absolute md:left-0 md:right-0 md:w-full md:max-w-screen-xl md:mx-auto">
            {/* Desktop: Search in TopBar - Centered */}
            {/* 50% width smaller at md (905px) until lg (1240px) */}
            <div className="w-full max-w-xl md:max-w-[288px] lg:max-w-xl">
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
          <div className="container-fluid w-full">
            <div className="relative flex items-center gap-1.5 overflow-x-auto py-2.5 sm:gap-2 md:gap-3 md:py-3 md:px-0">
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
                      ? "text-ztg-green-400"
                      : "text-ztg-green-400/80 group-hover:text-ztg-green-400"
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
                      ? "text-ztg-green-400"
                      : "text-ztg-green-400/80 group-hover:text-ztg-green-400"
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
                      ? "text-ztg-green-400"
                      : "text-ztg-green-400/80 group-hover:text-ztg-green-400"
                  }`}
                />
                <span className="whitespace-nowrap">Trending</span>
              </Link>
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Menu as="div" className="relative">
                  {({ open }) => (
                    <>
                      <Menu.Button className="group flex shrink-0 items-center gap-1.5 rounded-lg bg-ztg-green-600/90 px-2.5 py-2 text-xs font-bold text-white shadow-md backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-lg active:scale-95 sm:gap-2 sm:px-3 sm:text-sm md:px-4">
                        <FiPlusSquare
                          size={14}
                          className="hidden shrink-0 sm:inline sm:h-4 sm:w-4"
                        />
                        <span className="whitespace-nowrap font-bold">Create Market</span>
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
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border-2 border-white/10 bg-ztg-primary-700/95 shadow-xl backdrop-blur-lg ring-2 ring-white/5 focus:outline-none">
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
                                      className="text-ztg-green-400"
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
                                      className="text-ztg-green-400"
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
        </div>
      )}

      {/* Market Filters Section - shown only on markets pages */}
      {showMarketFilters && (
        <Suspense fallback={<div className="h-[50px]" />}>
          <MarketFilterSelectionWrapper />
        </Suspense>
      )}
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
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:pb-0"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 md:h-10 md:w-10">
            <Image
              src={category.imagePath}
              fill
              alt="Markets menu"
              sizes="100"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-semibold text-white md:text-sm">{category.name}</div>
            <div className="h-[14px] text-[10px] font-light text-white/80 md:h-[16px] md:text-xs">
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
        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5"
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-ztg-green-400 md:h-10 md:w-10">
          <MdShowChart size={18} className="md:h-5 md:w-5" />
        </div>
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-white md:text-sm">Single Market</div>
        </div>
      </Link>

      <Link
        onClick={onSelect}
        href="/create-combo"
        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5"
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-ztg-green-400 md:h-10 md:w-10">
          <MdStackedLineChart size={18} className="md:h-5 md:w-5" />
        </div>
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-white md:text-sm">Combinatorial Market</div>
          <div className="text-[10px] font-light text-white/80 md:text-xs">
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
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (categoriesOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [categoriesOpen, isMobile]);

  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
              active ? "bg-white/20" : ""
            }`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCategoriesOpen(!categoriesOpen);
            }}
          >
            <div className="relative h-4 w-4 shrink-0 text-ztg-green-400 md:h-5 md:w-5">
              <FiList size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-xs font-semibold text-white md:text-sm">
              Categories
            </h3>
            <FiArrowRight size={16} className="shrink-0 text-white md:h-[18px] md:w-[18px]" />
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
            height: "calc(100vh - var(--top-bar-height, 50px) - 20px)",
            backgroundColor: "#1a1e3b",
          }}
        >
          <div
            className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-all hover:bg-white/20 md:hidden"
            onClick={() => setCategoriesOpen(false)}
          >
            <FiArrowLeft size={18} className="text-white" />
            <span className="text-xs font-semibold text-white">Back to Menu</span>
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
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (createMarketOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [createMarketOpen, isMobile]);

  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white transition-all hover:bg-white/20 md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
              active ? "bg-white/20" : ""
            }`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCreateMarketOpen(!createMarketOpen);
            }}
          >
            <div className="relative h-4 w-4 shrink-0 text-ztg-green-400 md:h-5 md:w-5">
              <FiPlusSquare size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-xs font-semibold text-white md:text-sm">
              Create Market
            </h3>
            <FiArrowRight size={16} className="shrink-0 text-white md:h-[18px] md:w-[18px]" />
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
            height: "calc(100vh - var(--top-bar-height, 50px) - 20px)",
            backgroundColor: "#1a1e3b",
          }}
        >
          <div
            className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-all hover:bg-white/20 md:hidden"
            onClick={() => setCreateMarketOpen(false)}
          >
            <FiArrowLeft size={18} className="text-white" />
            <span className="text-xs font-semibold text-white">Back to Menu</span>
          </div>
          <CreateMarketMenu onSelect={onSelect} />
        </div>
      </Transition>
    </>
  );
};

export default TopBar;
