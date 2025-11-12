import Link from "next/link";
import React, { Fragment } from "react";
import { useRouter } from "next/router";
import { Menu, Transition } from "@headlessui/react";
import { FiGrid, FiStar, FiPlusSquare } from "react-icons/fi";
import {
  MdFavoriteBorder,
  MdShowChart,
  MdStackedLineChart,
} from "react-icons/md";
import { TrendingUp, ChevronDown } from "react-feather";

const QuickNav = () => {
  const router = useRouter();

  // Hide on markets list pages (they have their own filter system)
  const hideOnPages = ["/markets", "/markets/favorites"];
  if (hideOnPages.includes(router.pathname)) {
    return null;
  }

  const navItems = [
    {
      label: "All Markets",
      href: "/markets",
      icon: <FiGrid size={14} />,
      isActive: router.pathname === "/markets" && !router.query.status,
    },
    {
      label: "Active",
      href: "/markets?status=Active&ordering=Newest&liquidityOnly=true",
      icon: <TrendingUp size={14} />,
      isActive:
        router.query.status === "Active" && router.query.ordering === "Newest",
    },
    {
      label: "Trending",
      href: "/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true",
      icon: <FiStar size={14} />,
      isActive:
        router.query.status === "Active" &&
        router.query.ordering === "Most Volume",
    },
  ];

  return (
    <div className="sticky top-[42px] z-30 w-full overflow-visible border-b-1 border-ztg-primary-200/30 bg-white/80 shadow-md backdrop-blur-md">
      <div className="container-fluid">
        <div className="relative flex items-center gap-1 py-1 sm:py-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`group flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 ${
                item.isActive
                  ? "bg-white/20 text-white ring-2 ring-ztg-green-500/50"
                  : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span
                className={`hidden text-ztg-green-400 sm:inline sm:h-4 sm:w-4 ${
                  item.isActive
                    ? "text-ztg-green-400"
                    : "text-ztg-green-400/80 group-hover:text-ztg-green-400"
                }`}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  size: 14,
                })}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
          <div className="ml-auto">
            <Menu as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95 sm:gap-2 sm:px-2.5 sm:text-sm md:px-3 ${
                      open
                        ? "bg-white/15 text-white"
                        : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <FiPlusSquare
                      size={14}
                      className="hidden text-ztg-green-400 sm:inline sm:h-4 sm:w-4"
                    />
                    <span>Create Market</span>
                    <ChevronDown
                      size={14}
                      className={`ml-0.5 transition-transform sm:h-4 sm:w-4 ${open ? "rotate-180" : ""}`}
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
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border-2 border-white/20 bg-white/95 shadow-xl backdrop-blur-lg focus:outline-none">
                      <div className="p-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/create">
                              <button
                                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                                  active ? "bg-ztg-primary-50/60" : ""
                                }`}
                              >
                                <MdShowChart
                                  size={18}
                                  className="text-ztg-primary-600"
                                />
                                <div className="flex flex-col items-start">
                                  <span className="font-semibold text-ztg-primary-900">
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
                                  active ? "bg-ztg-primary-50/60" : ""
                                }`}
                              >
                                <MdStackedLineChart
                                  size={18}
                                  className="text-ztg-primary-600"
                                />
                                <div className="flex flex-col items-start">
                                  <span className="font-semibold text-ztg-primary-900">
                                    Combinatorial Market
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    Multi-market combinations
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
  );
};

export default QuickNav;
