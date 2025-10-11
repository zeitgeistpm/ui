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
import { Alerts } from "./Alerts";
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

  // Hide QuickNav on markets list pages (they have their own filter system)
  const hideQuickNavOnPages = ["/markets", "/markets/favorites"];
  const showQuickNav = !hideQuickNavOnPages.includes(router.pathname);
  const showMarketFilters = hideQuickNavOnPages.includes(router.pathname);

  // Set CSS variable for top-bar height so mobile menus can position correctly
  useEffect(() => {
    const updateTopBarHeight = () => {
      if (topBarRef.current) {
        const height = topBarRef.current.offsetHeight;
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
      <div className="bg-sky-950/95 py-1.5 backdrop-blur-md">
        <div className="container-fluid relative flex h-full items-center">
          <div className="hidden h-full items-center justify-center md:flex">
            <Link href="/">
              <MenuLogo />
            </Link>
          </div>
          <div className="flex items-center gap-3 border-x-0 border-sky-200 md:border-x-1 md:px-5">
            {/* Markets Menu - Mobile Only */}
            <Menu
              as="div"
              className="relative inline-block text-left md:hidden"
            >
              {({ open, close }) => {
                return (
                  <>
                    <div className="flex gap-2">
                      <Menu.Button className="center relative flex gap-2 rounded-lg px-2 py-1 font-light text-sky-100 transition-all hover:bg-white/10">
                        <div className="relative hidden flex-col items-center md:flex">
                          <FiGrid size="20px" />
                          <div className="hidden text-xs md:block">Markets</div>
                        </div>
                        <div className="block md:hidden">
                          <MenuIcon />
                        </div>
                      </Menu.Button>
                      <Link href="/" className="pl-2 md:hidden">
                        <MenuLogo />
                      </Link>
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
                        className="fixed bottom-0 left-0 right-0 z-[60] w-screen overflow-y-auto bg-sky-50 px-5 py-3 text-sky-900 shadow-xl focus:outline-none md:absolute md:inset-auto md:left-0 md:top-auto md:mt-8 md:h-auto md:w-72 md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"
                        style={{
                          top: "var(--top-bar-height, 50px)",
                          height: "calc(100vh - var(--top-bar-height, 50px))",
                        }}
                      >
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/markets?status=Active&ordering=Newest&liquidityOnly=true"
                              onClick={close}
                            >
                              <button
                                className={`group mb-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all hover:bg-white/80 ${active ? "bg-white/80" : ""}`}
                              >
                                <div className="relative h-6 w-6 text-sky-900">
                                  <FiGrid size={"100%"} />
                                </div>

                                <h3 className="text-sm font-semibold text-sky-900">
                                  All Markets
                                </h3>
                              </button>
                            </Link>
                          )}
                        </Menu.Item>

                        <CreateMarketMenuItem onSelect={close} />

                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true"
                              onClick={close}
                            >
                              <button
                                className={`group mb-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all hover:bg-white/80 ${active ? "bg-white/80" : ""}`}
                              >
                                <div className="relative h-6 w-6 text-sky-900">
                                  <FiStar size={"100%"} />
                                </div>

                                <h3 className="text-sm font-semibold text-sky-900">
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
                                className={`group mb-4 flex w-full items-center gap-3 rounded-md border-b-1 border-gray-200 p-3 px-3 py-2.5 pb-5 text-sm transition-all hover:bg-white/80 ${active ? "bg-white/80" : ""}`}
                              >
                                <div className="relative h-6 w-6 text-sky-900">
                                  <MdFavoriteBorder size={"100%"} />
                                </div>

                                <h3 className="text-sm font-semibold text-sky-900">
                                  Favorites
                                </h3>
                              </button>
                            </Link>
                          )}
                        </Menu.Item>

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

                        <CategoriesMenuItem onSelect={close} />

                        {process.env.NEXT_PUBLIC_SHOW_COURT === "true" && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link href="/court" onClick={close}>
                                <button
                                  className={`group mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all hover:bg-white/80 ${active ? "bg-white/80" : ""}`}
                                >
                                  <div className="relative z-10 h-6 w-6 text-sky-900">
                                    <Users size={"100%"} />
                                  </div>
                                  <h3 className="text-sm font-semibold text-sky-900">
                                    Court
                                  </h3>
                                </button>
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                      </Menu.Items>
                    </Transition>
                  </>
                );
              }}
            </Menu>

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
          <MarketSearch />
          <div className="center relative ml-auto gap-3">
            {/* <GetTokensButton /> */}
            <Alerts />
            <AccountButton />
          </div>
        </div>
      </div>

      {/* QuickNav Section */}
      {showQuickNav && (
        <div className="relative z-30 w-full border-b-1 border-sky-200/30 bg-sky-50 shadow-sm backdrop-blur-md">
          <div className="container-fluid w-full">
            <div className="relative flex items-center gap-1 py-1 sm:py-2">
              <Link
                href="/markets"
                className="flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-sky-900 transition-all hover:bg-sky-100/80 sm:min-h-0 sm:px-3 sm:py-1"
              >
                <span className="hidden text-sky-600 sm:inline">
                  <FiGrid size={16} className="sm:h-3.5 sm:w-3.5" />
                </span>
                <span>All Markets</span>
              </Link>
              <Link
                href="/markets?status=Active&ordering=Newest&liquidityOnly=true"
                className="flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-sky-900 transition-all hover:bg-sky-100/80 sm:min-h-0 sm:px-3 sm:py-1"
              >
                <span className="hidden text-sky-600 sm:inline">
                  <TrendingUp size={16} className="sm:h-3.5 sm:w-3.5" />
                </span>
                <span>Active</span>
              </Link>
              <Link
                href="/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true"
                className="flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-sky-900 transition-all hover:bg-sky-100/80 sm:min-h-0 sm:px-3 sm:py-1"
              >
                <span className="hidden text-sky-600 sm:inline">
                  <FiStar size={16} className="sm:h-3.5 sm:w-3.5" />
                </span>
                <span>Trending</span>
              </Link>
              <div className="ml-auto">
                <Menu as="div" className="relative">
                  {({ open }) => (
                    <>
                      <Menu.Button className="flex min-h-11 items-center gap-1.5 rounded-md bg-sky-900 px-2 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md sm:min-h-0 sm:px-3 sm:py-1">
                        <FiPlusSquare
                          size={16}
                          className="hidden sm:inline sm:h-3.5 sm:w-3.5"
                        />
                        <span>Create Market</span>
                        <ChevronDown
                          size={16}
                          className={`ml-0.5 transition-transform sm:h-3.5 sm:w-3.5 ${open ? "rotate-180" : ""}`}
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
                        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-white/20 bg-white/95 shadow-xl backdrop-blur-lg focus:outline-none">
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link href="/create">
                                  <button
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                                      active ? "bg-sky-50/60" : ""
                                    }`}
                                  >
                                    <MdShowChart
                                      size={18}
                                      className="text-sky-600"
                                    />
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold text-sky-900">
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
                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                                      active ? "bg-sky-50/60" : ""
                                    }`}
                                  >
                                    <MdStackedLineChart
                                      size={18}
                                      className="text-sky-600"
                                    />
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold text-sky-900">
                                        Combinatorial Market
                                      </span>
                                      <span className="text-xs text-gray-600">
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
    <div className="grid grid-flow-row-dense grid-cols-2 gap-3 md:h-full md:grid-cols-3">
      {topCategories.map((category, index) => (
        <Link
          key={index}
          onClick={onSelect}
          href={`/markets?status=Active&tag=${category.name}&ordering=Newest&liquidityOnly=true`}
          className="flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-white/80 md:pb-0"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-gray-300">
            <Image
              src={category.imagePath}
              fill
              alt="Markets menu"
              sizes="100"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-light text-sky-900">{category.name}</div>
            <div className="h-[16px] text-xs font-light text-sky-900">
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
    <div className="flex flex-col gap-4">
      <Link
        onClick={onSelect}
        href="/create"
        className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-white/80"
      >
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 text-sky-900">
          <MdShowChart size={24} />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-sky-900">Single Market</div>
        </div>
      </Link>

      <Link
        onClick={onSelect}
        href="/create-combo"
        className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-white/80"
      >
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 text-sky-900">
          <MdStackedLineChart size={24} />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-sky-900">Combinatorial Market</div>
          <div className="text-xs font-light text-gray-600">
            Create a complex multi-outcome market
          </div>
        </div>
      </Link>
    </div>
  );
};

const CategoriesMenuItem = ({ onSelect }: { onSelect: () => void }) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group z-20 mb-4 flex w-full items-center gap-3 rounded-md border-b-1 border-gray-200 px-3 py-2.5 pb-5 text-sm transition-all hover:bg-white/80 ${active ? "bg-white/80" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCategoriesOpen(!categoriesOpen);
            }}
          >
            <div className="relative h-6 w-6 text-sky-900">
              <FiList size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-sm font-semibold text-sky-900">
              Categories
            </h3>
            <FiArrowRight size={22} className="text-sky-900" />
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
          className="fixed bottom-0 left-0 right-0 z-[70] w-screen overflow-y-auto bg-sky-50 px-5 py-3 shadow-xl md:absolute md:inset-auto md:-right-4 md:left-auto md:ml-4 md:h-auto md:w-[600px] md:translate-x-[100%] md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"
          style={{
            top: "var(--top-bar-height, 50px)",
            height: "calc(100vh - var(--top-bar-height, 50px))",
          }}
        >
          <div
            className="mb-6 flex cursor-pointer items-center gap-3 rounded-lg border-b-1 border-gray-200 py-4 pl-2 transition-all hover:bg-white/80 md:hidden"
            onClick={() => setCategoriesOpen(false)}
          >
            <FiArrowLeft size={26} className="text-sky-900" />
            <span className="font-semibold text-sky-900">Back to Menu</span>
          </div>
          <CategoriesMenu onSelect={onSelect} />
        </div>
      </Transition>
    </>
  );
};

const CreateMarketMenuItem = ({ onSelect }: { onSelect: () => void }) => {
  const [createMarketOpen, setCreateMarketOpen] = useState(false);
  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group z-20 mb-4 flex w-full items-center gap-3 rounded-md border-b-1 border-gray-200 px-3 py-2.5 pb-5 text-sm transition-all hover:bg-white/80 ${active ? "bg-white/80" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCreateMarketOpen(!createMarketOpen);
            }}
          >
            <div className="relative h-6 w-6 text-sky-900">
              <FiPlusSquare size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-sm font-semibold text-sky-900">
              Create Market
            </h3>
            <FiArrowRight size={22} className="text-sky-900" />
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
          className="fixed bottom-0 left-0 right-0 z-[70] w-screen overflow-y-auto bg-sky-50 px-5 py-3 shadow-xl md:absolute md:inset-auto md:-right-4 md:left-auto md:ml-4 md:h-auto md:w-[400px] md:translate-x-[100%] md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"
          style={{
            top: "var(--top-bar-height, 50px)",
            height: "calc(100vh - var(--top-bar-height, 50px))",
          }}
        >
          <div
            className="mb-6 flex cursor-pointer items-center gap-3 rounded-lg border-b-1 border-gray-200 py-4 pl-2 transition-all hover:bg-white/80 md:hidden"
            onClick={() => setCreateMarketOpen(false)}
          >
            <FiArrowLeft size={26} className="text-sky-900" />
            <span className="font-semibold text-sky-900">Back to Menu</span>
          </div>
          <CreateMarketMenu onSelect={onSelect} />
        </div>
      </Transition>
    </>
  );
};

export default TopBar;
