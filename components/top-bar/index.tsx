import { observer } from "mobx-react";
import React, { useEffect, useState, FC } from "react";

import MarketSearch from "./MarketSearch";
import Logo from "../icons/ZeitgeistIcon";
import { Menu, X } from "react-feather";
import Link from "next/link";
import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

type NavbarColor = "black" | "white" | "transparent";

const AccountButton = dynamic(() => import("../account/AccountButton"), {
  ssr: false,
});

const MobileTopBar: FC<{
  navbar: NavbarColor;
  setNavBarBG: (NavbarColor) => void;
}> = observer(({ navbar, setNavBarBG }) => {
  const store = useStore();
  const { pathname } = useRouter();
  console.log(navbar);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  const handleMenuClick = () => {
    store.toggleShowMobileMenu();
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const scrollY = window.scrollY;
    setScrollPosition(scrollY);
    if (menuOpen) {
      document.body.style.position = "fixed";
    } else {
      document.body.style.position = "static";
      window.scrollBy(0, scrollPosition);
    }

    if (pathname === "/" && menuOpen) {
      console.log("HP open");
      setNavBarBG("white");
    } else {
      setNavBarBG("black");
    }
  }, [menuOpen]);
  console.log(navbar);
  return (
    <div className="flex items-center w-full">
      <Logo dark={navbar === "white" ? true : false} />
      <h1
        className={`font-bold font-kanit pl-4 ${
          navbar === "white" ? "text-black" : "text-white"
        }`}
      >
        Zeitgeist
      </h1>
      {store.showMobileMenu ? (
        <X
          className="ml-auto cursor-pointer text-white"
          color={`${navbar === "white" ? "black" : "white"}`}
          onClick={handleMenuClick}
        />
      ) : (
        <Menu
          color={`${navbar === "white" ? "black" : "white"}`}
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
  }, []);

  const { pathname } = useRouter();

  return (
    <div
      className={`flex w-full py-7 fixed z-40 transition-[background] duration-500 ${
        pathname === "/" ? "none" : "border-b border-gray-200"
      }`}
      style={{
        backgroundColor: navbarBGColor,
      }}
    >
      <div className="hidden md:flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto px-8">
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
        {/* <MarketSearch /> */}
        <AccountButton />
      </div>
      <div className="md:hidden w-full container-fluid">
        <MobileTopBar navbar={navbarBGColor} setNavBarBG={setNavbarBGColor} />
      </div>
    </div>
  );
});

export default TopBar;
