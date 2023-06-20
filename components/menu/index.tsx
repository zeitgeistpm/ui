import { Fragment, useState } from "react";

import { Menu, Transition } from "@headlessui/react";
import { CATEGORIES } from "components/front-page/PopularCategories";
import MenuLogo from "components/menu/MenuLogo";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Menu as MenuIcon } from "react-feather";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

const AccountButton = dynamic(() => import("../account/AccountButton"), {
  ssr: false,
});

const TopBar = () => {
  return (
    <div
      className={`w-screen py-3.5 fixed z-40 transition-all duration-300 bg-black`}
    >
      <div className="relative flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto md:px-8 px-3">
        <div className="hidden md:block border-r-1 border-blue-600 pr-3 md:pr-7">
          <Link href="/">
            <MenuLogo />
          </Link>
        </div>
        <div className="md:pl-7 flex flex-1 gap-7">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="text-white font-light relative flex center gap-2">
                <div className="relative h-6 w-6 hidden md:block">
                  <Image src="/menu.svg" fill alt="Markets menu" sizes="100" />
                </div>
                <div className="hidden md:block">Markets</div>
                <div className="block md:hidden">
                  <MenuIcon />
                </div>
                <div className="md:hidden pl-2">
                  <MenuLogo />
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 translate-y-6 md:translate-y-0 md:scale-95"
              enterTo="transform opacity-100 translate-y-0 md:scale-100"
              leave="transition ease-in translate-y-6 md:translate-y-0 duration-75"
              leaveFrom="transform opacity-100 translate-y-0 md:scale-100"
              leaveTo="transform opacity-0 translate-y-6 md:translate-y-0 md:scale-95"
            >
              <Menu.Items className="fixed md:absolute left-0 mt-4 md:mt-8 w-full h-full ring-1 ring-gray-200 md:h-auto md:w-64 py-3 px-5 origin-top-right md:rounded-md bg-white focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`group flex w-full items-center rounded-md px-2 py-2 text-sm gap-3 mb-4`}
                    >
                      <div className="relative h-6 w-6 invert">
                        <Image
                          src="/menu.svg"
                          fill
                          alt="Markets menu"
                          sizes="100"
                        />
                      </div>
                      <h3 className="text-sm font-semibold">All Markets</h3>
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`group flex w-full items-center  px-2 py-2 text-sm gap-3 mb-4 border-b-1 border-gray-300 pb-5`}
                    >
                      <div className="relative h-6 w-6">
                        <Image
                          src="/star.svg"
                          fill
                          alt="Markets menu"
                          sizes="100"
                        />
                      </div>
                      <h3 className="text-sm font-semibold">Popular Markets</h3>
                    </button>
                  )}
                </Menu.Item>

                <div className="block md:hidden">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`group flex w-full items-center  px-2 py-2 text-sm gap-3 mb-4`}
                      >
                        <div className="relative h-6 w-6 invert">
                          <Image
                            src="/award.svg"
                            fill
                            alt="Markets menu"
                            sizes="100"
                          />
                        </div>
                        <h3 className="text-sm font-semibold">Leaderboard</h3>
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <CategoriesMenuItem />

                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`group flex w-full items-center  rounded-md px-2 py-2 text-sm gap-3`}
                    >
                      <div className="relative h-6 w-6 z-10">
                        <Image
                          src="/plus-square.svg"
                          fill
                          alt="Markets menu"
                          sizes="100"
                        />
                      </div>
                      <h3 className="text-sm font-semibold">Create Market</h3>
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>

          <Link
            type="button"
            className="text-white font-light relative hidden md:flex md:center gap-2"
            href="/leaderboard"
          >
            <div className="relative h-6 w-6">
              <Image src="/award.svg" fill alt="Markets menu" sizes="100" />
            </div>
            <div>Leaderboard</div>
          </Link>
        </div>
        <AccountButton />
      </div>
    </div>
  );
};

const CategoriesMenu = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 grid-flow-row-dense md:h-full">
      {CATEGORIES.map((category, index) => (
        <div className="flex gap-3 items-center pb-6 md:pb-0" key={index}>
          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-gray-300">
            <Image
              src={category.imagePath}
              fill
              alt="Markets menu"
              sizes="100"
            />
          </div>
          <div className="font-light">{category.name}</div>
        </div>
      ))}
    </div>
  );
};

const CategoriesMenuItem = () => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  return (
    <>
      <Menu.Item>
        {({ active }) => (
          <button
            className={`group flex w-full items-center px-2 py-2 text-sm gap-3 mb-4 border-b-1 border-gray-300 pb-5 z-20`}
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setCategoriesOpen(!categoriesOpen);
            }}
          >
            <div className="relative h-6 w-6">
              <Image src="/list.svg" fill alt="Markets menu" sizes="100" />
            </div>
            <h3 className="text-sm font-semibold flex-1 text-left">
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
        <div className="fixed md:absolute ring-1 ring-gray-200 z-50 w-full md:w-[600px] h-full top-0 left-0 md:left-auto md:-right-4 md:ml-4 py-3 px-5 md:translate-x-[100%] md:rounded-md bg-white">
          <div
            className="md:hidden border-b-1 border-gray-300 mb-6 py-4 flex items-center gap-3 pl-2 cursor-pointer"
            onClick={() => setCategoriesOpen(false)}
          >
            <FiArrowLeft size={26} />
            Menu
          </div>
          <CategoriesMenu />
        </div>
      </Transition>
    </>
  );
};

export default TopBar;
