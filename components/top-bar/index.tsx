import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import MobileTopBar from "./MobileTopBar";

import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import MenuLogo from "components/menu/MenuLogo";

export type NavbarColor = "black" | "white" | "transparent";

const AccountButton = dynamic(() => import("../account/AccountButton"), {
  ssr: false,
});

const TopBar = () => {
  const { blockNumber } = useStore();
  const { pathname } = useRouter();

  const [navbarBGColor, setNavbarBGColor] =
    useState<NavbarColor>("transparent");

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  const changeNavBG = (open = false) => {
    console.log("state: " + open);
    console.log(pathname);
    if (menuOpen) {
      setNavbarBGColor("white");
    } else if (window.scrollY >= 60 && pathname === "/" && !menuOpen) {
      setNavbarBGColor("black");
    } else if (pathname === "/" && !menuOpen) {
      setNavbarBGColor("transparent");
    } else {
      setNavbarBGColor("white");
    }
    return;
  };

  useEffect(() => {
    window.addEventListener("scroll", () => {
      changeNavBG();
    });
  }, ["", menuOpen]);

  useEffect(() => {
    const scrollY = window.scrollY;
    setScrollPosition(scrollY);
    if (menuOpen) {
      document.body.style.position = "fixed";
    } else {
      document.body.style.position = "static";
      window.scrollBy(0, scrollPosition);
    }
    changeNavBG();
  }, ["", menuOpen]);

  return (
    <div
      className={`flex w-full py-7 fixed z-40 transition-all duration-300 bg-${navbarBGColor} ${
        pathname === "/" ? "border-0" : "border-b border-gray-200"
      }`}
    >
      <div className="hidden md:flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto px-8">
        <MenuLogo
          pathname={pathname}
          blockNumber={blockNumber}
          menuOpen={menuOpen}
        />
        {/* <MarketSearch /> */}
        <AccountButton />
      </div>
      <div className="md:hidden w-full container-fluid">
        <MobileTopBar
          pathname={pathname}
          navbar={navbarBGColor}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          blockNumber={blockNumber}
        />
      </div>
    </div>
  );
};

export default TopBar;
