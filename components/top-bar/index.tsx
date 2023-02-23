import { observer } from "mobx-react";
import React, { useEffect, useState, FC } from "react";

import AccountButton from "../account/AccountButton";
import MarketSearch from "./MarketSearch";
import Logo from "../icons/ZeitgeistIcon";
import { Menu, X } from "react-feather";
import Link from "next/link";
import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";

type NavbarColor = "black" | "white" | "transparent";

const MobileTopBar: FC<{ navbar: NavbarColor }> = observer(({ navbar }) => {
  const store = useStore();

  const handleMenuClick = () => {
    store.toggleShowMobileMenu();
  };

  return (
    <div className="flex items-center w-full">
      <Logo dark={navbar === "black" ? true : false} />
      <h1
        className={`font-bold font-kanit ${
          navbar ? "text-black" : "text-white"
        }`}
      >
        Zeitgeist
      </h1>
      {store.showMobileMenu ? (
        <X
          className="ml-auto cursor-pointer text-white"
          color={`${navbar ? "white" : "black"}`}
          onClick={handleMenuClick}
        />
      ) : (
        <Menu
          color={`${navbar ? "black" : "white"}`}
          className="ml-auto cursor-pointer"
          onClick={handleMenuClick}
        />
      )}
    </div>
  );
});

const TopBar = observer(() => {
  const { blockNumber } = useStore();
  const [navbarBGColor, setNavbarBGColor] =
    useState<NavbarColor>("transparent");

  const changeNavBG = () => {
    if (window.scrollY >= 60 && pathname === "/") {
      setNavbarBGColor("black");
    } else if (pathname === "/") {
      setNavbarBGColor("transparent");
    } else {
      setNavbarBGColor("white");
    }
  };

  useEffect(() => {
    changeNavBG();
    window.addEventListener("scroll", changeNavBG);
  });

  const { pathname } = useRouter();

  return (
    <div
      className={`flex w-full py-7 bg-transparent fixed z-40`}
      style={{
        backgroundColor: navbarBGColor,
        borderBottom: `${pathname === "/" ? "none" : "solid 1px #D8E1E7"}`,
      }}
    >
      <div className="hidden sm:flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto px-8">
        <Link className="flex flex-1 items-center gap-4" href="/" role="button">
          <Logo dark={pathname === "/" ? false : true} />
          <>
            <div className="flex flex-col items-center">
              <h1
                className={`font-bold font-kanit text-xl ${
                  pathname === "/" ? "text-white" : "text-black"
                }`}
              >
                Zeitgeist
              </h1>
              <span className="w-full text-start text-xs font-mono text-sky-600">
                {blockNumber ? blockNumber.toHuman() : 0}
              </span>
            </div>
          </>
        </Link>
        <MarketSearch />
        <AccountButton />
      </div>
      <div className="sm:hidden w-full container-fluid">
        <MobileTopBar navbar={navbarBGColor} />
      </div>
    </div>
  );
});

export default TopBar;
