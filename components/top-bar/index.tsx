import { Fragment, Suspense, useState } from "react";

import { Menu, Transition } from "@headlessui/react";
import { CATEGORIES } from "components/front-page/PopularCategories";
import MenuLogo from "components/top-bar/MenuLogo";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Menu as MenuIcon, Users } from "react-feather";
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
        <div className="animate-pulse text-xs">...</div>
      </div>
    ),
  },
);

const TopBar = () => {
  return (
    <div
      className={`fixed top-0 z-40 h-topbar-height w-full bg-black py-3.5 transition-all duration-300`}
    >
      <div className="relative flex h-full items-center px-4">
        <div className="hidden h-full items-center justify-center pr-3 md:flex md:pr-7">
          <Link href="/">
            <MenuLogo />
          </Link>
        </div>
        <div className="flex items-center gap-7 border-x-0 border-ztg-blue py-2 md:border-x-1 md:px-7">
          <Menu as="div" className="relative inline-block text-left">
            {({ open, close }) => {
              return (
                <>
                  <div className="flex gap-2">
                    <Menu.Button className="center relative flex gap-2 font-light text-white">
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
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                    enterTo="transform opacity-100 translate-y-0 md:scale-100"
                    leave="transition ease-in translate-y-2 md:translate-y-0 duration-75"
                    leaveFrom="transform opacity-100 translate-y-0 md:scale-100"
                    leaveTo="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                  >
                    <Menu.Items className="fixed left-0 mt-4 h-full w-full origin-top-right bg-white px-5 py-3 ring-1 ring-gray-200 focus:outline-none md:absolute md:mt-8 md:h-auto md:w-64 md:rounded-md">
                      <Menu.Item>
                        {({ active, close }) => (
                          <Link
                            href="/markets?status=Active&ordering=Newest&liquidityOnly=true"
                            onClick={close}
                          >
                            <button
                              className={`group mb-4 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm`}
                            >
                              <div className="relative h-6 w-6">
                                <FiGrid size={"100%"} />
                              </div>

                              <h3 className="text-sm font-semibold">
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
                              className={`group mb-4 flex w-full  items-center gap-3 border-gray-300 px-2 py-2 text-sm`}
                            >
                              <div className="relative h-6 w-6">
                                <FiStar size={"100%"} />
                              </div>

                              <h3 className="text-sm font-semibold">
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
                              className={`group mb-4 flex w-full items-center gap-3 border-b-1 px-2 py-2 pb-5 text-sm`}
                            >
                              <div className="relative h-6 w-6">
                                <MdFavoriteBorder size={"100%"} />
                              </div>

                              <h3 className="text-sm font-semibold">
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
                                className={`group mt-4 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm`}
                              >
                                <div className="relative z-10 h-6 w-6">
                                  <Users size={"100%"} />
                                </div>
                                <h3 className="text-sm font-semibold">Court</h3>
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

          <Menu
            as="div"
            className="relative hidden md:inline-block md:text-left"
          >
            {({ open, close }) => {
              return (
                <>
                  <Menu.Button className="md:center relative hidden gap-2 font-light text-white md:flex">
                    <div className="relative hidden flex-col items-center md:flex">
                      <FiPlusSquare size="20px" />
                      <div className="hidden whitespace-nowrap text-xs md:block">
                        Create Market
                      </div>
                    </div>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                    enterTo="transform opacity-100 translate-y-0 md:scale-100"
                    leave="transition ease-in translate-y-2 md:translate-y-0 duration-75"
                    leaveFrom="transform opacity-100 translate-y-0 md:scale-100"
                    leaveTo="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
                  >
                    <Menu.Items className="fixed left-0 mt-4 h-full w-full origin-top-right bg-white px-5 py-3 ring-1 ring-gray-200 focus:outline-none md:absolute md:mt-8 md:h-auto md:w-64 md:rounded-md">
                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/create" onClick={close}>
                            <button
                              className={`group mb-4 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm`}
                            >
                              <div className="relative h-6 w-6">
                                <MdShowChart size={"100%"} />
                              </div>
                              <h3 className="text-sm font-semibold">
                                Single Market
                              </h3>
                            </button>
                          </Link>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <Link href="/create-combo" onClick={close}>
                            <button
                              className={`group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm`}
                            >
                              <div className="relative h-6 w-6">
                                <MdStackedLineChart size={"100%"} />
                              </div>
                              <h3 className="text-sm font-semibold">
                                Combinatorial Market
                              </h3>
                            </button>
                          </Link>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </>
              );
            }}
          </Menu>

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
          <AccountButton />
          <Alerts />
        </div>
      </div>
    </div>
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
          <div className="relative z-20 block h-full sm:w-[125px] ">
            <button className="center h-full w-full rounded-md bg-black text-white">
              Get Tokens
            </button>
          </div>
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
        <div className="relative z-20 block h-full sm:w-[100px] ">
          <button className="center h-full w-full rounded-md bg-black text-white">
            Airdrop!
          </button>
        </div>
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
    <div className="grid grid-flow-row-dense grid-cols-2 md:h-full md:grid-cols-3">
      {topCategories.map((category, index) => (
        <Link
          key={index}
          onClick={onSelect}
          href={`/markets?status=Active&tag=${category.name}&ordering=Newest&liquidityOnly=true`}
          className="flex items-center gap-3 pb-6 md:pb-0"
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
            <div className="font-light">{category.name}</div>
            <div className="h-[16px] text-xs font-light">{category.count}</div>
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
        className="flex items-center gap-3"
      >
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300">
          <MdShowChart size={24} />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold">Single Market</div>
          <div className="text-xs font-light text-gray-600">
            Create a traditional prediction market
          </div>
        </div>
      </Link>

      <Link
        onClick={onSelect}
        href="/create-combo"
        className="flex items-center gap-3"
      >
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300">
          <MdStackedLineChart size={24} />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold">Combinatorial Market</div>
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
            className={`group z-20 mb-4 flex w-full items-center gap-3 border-b-1 border-gray-300 px-2 py-2 pb-5 text-sm`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCategoriesOpen(!categoriesOpen);
            }}
          >
            <div className="relative h-6 w-6">
              <FiList size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-sm font-semibold">
              Categories
            </h3>
            <FiArrowRight size={22} />
          </button>
        )}
      </Menu.Item>

      <Transition
        as={Fragment}
        show={categoriesOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 translate-x-6 md:scale-95"
        enterTo="transform opacity-100 translate-x-0 md:scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 translate-x-0 md:scale-100"
        leaveTo="transform opacity-0 translate-x-6 md:scale-95"
      >
        <div className="fixed left-0 top-0 z-50 h-full w-full bg-white px-5 py-3 ring-1 ring-gray-200 md:absolute md:-right-4 md:left-auto md:ml-4 md:w-[600px] md:translate-x-[100%] md:rounded-md">
          <div
            className="mb-6 flex cursor-pointer items-center gap-3 border-b-1 border-gray-300 py-4 pl-2 md:hidden"
            onClick={() => setCategoriesOpen(false)}
          >
            <FiArrowLeft size={26} />
            Menu
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
            className={`group z-20 mb-4 flex w-full items-center gap-3 border-b-1 border-gray-300 px-2 py-2 pb-5 text-sm`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCreateMarketOpen(!createMarketOpen);
            }}
          >
            <div className="relative h-6 w-6">
              <FiPlusSquare size={"100%"} />
            </div>
            <h3 className="flex-1 text-left text-sm font-semibold">
              Create Market
            </h3>
            <FiArrowRight size={22} />
          </button>
        )}
      </Menu.Item>

      <Transition
        as={Fragment}
        show={createMarketOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 translate-x-6 md:scale-95"
        enterTo="transform opacity-100 translate-x-0 md:scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 translate-x-0 md:scale-100"
        leaveTo="transform opacity-0 translate-x-6 md:scale-95"
      >
        <div className="fixed left-0 top-0 z-50 h-full w-full bg-white px-5 py-3 ring-1 ring-gray-200 md:absolute md:-right-4 md:left-auto md:ml-4 md:w-[400px] md:translate-x-[100%] md:rounded-md">
          <div
            className="mb-6 flex cursor-pointer items-center gap-3 border-b-1 border-gray-300 py-4 pl-2 md:hidden"
            onClick={() => setCreateMarketOpen(false)}
          >
            <FiArrowLeft size={26} />
            Menu
          </div>
          <CreateMarketMenu onSelect={onSelect} />
        </div>
      </Transition>
    </>
  );
};

export default TopBar;
