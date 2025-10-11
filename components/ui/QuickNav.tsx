import Link from "next/link";
import React, { Fragment } from "react";
import { useRouter } from "next/router";
import { Menu, Transition } from "@headlessui/react";
import { FiGrid, FiStar, FiPlusSquare } from "react-icons/fi";
import { MdFavoriteBorder, MdShowChart, MdStackedLineChart } from "react-icons/md";
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
    },
    {
      label: "Active",
      href: "/markets?status=Active&ordering=Newest&liquidityOnly=true",
      icon: <TrendingUp size={14} />,
    },
    {
      label: "Trending",
      href: "/markets?status=Active&ordering=Most%20Volume&liquidityOnly=true",
      icon: <FiStar size={14} />,
    },
  ];

  return (
    <div className="sticky top-[42px] z-30 w-full overflow-visible border-b-1 border-sky-200/30 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="container-fluid">
        <div className="relative flex items-center gap-1 py-1 sm:py-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex min-h-[44px] items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-sky-900 transition-all hover:bg-sky-100/80 sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <span className="hidden text-sky-600 sm:inline">
                {React.cloneElement(item.icon as React.ReactElement, {
                  size: 16,
                  className: "sm:h-3.5 sm:w-3.5"
                })}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="ml-auto">
            <Menu as="div" className="relative">
              {({ open }) => (
                <>
                  <Menu.Button className="flex min-h-[44px] items-center gap-1.5 rounded-md bg-sky-600 px-2 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs">
                    <FiPlusSquare size={16} className="hidden sm:inline sm:h-3.5 sm:w-3.5" />
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
                                  active
                                    ? "bg-sky-50/60"
                                    : ""
                                }`}
                              >
                                <MdShowChart size={18} className="text-sky-600" />
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
                                  active
                                    ? "bg-sky-50/60"
                                    : ""
                                }`}
                              >
                                <MdStackedLineChart size={18} className="text-sky-600" />
                                <div className="flex flex-col items-start">
                                  <span className="font-semibold text-sky-900">
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
