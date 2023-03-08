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

  return (
    <div
      className={`flex w-full py-7 fixed z-40 transition-[background] duration-500 bg-${navbarBGColor} ${
        pathname === "/" ? "border-0" : "border-b border-gray-200"
      }`}
    >
      <div className="hidden md:flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto px-8">
        <MenuLogo pathname={pathname} blockNumber={blockNumber} />
        {/* <MarketSearch /> */}
        <AccountButton />
      </div>
      <div className="md:hidden w-full container-fluid">
        <MobileTopBar
          navbar={navbarBGColor}
          setNavBarBG={setNavbarBGColor}
          blockNumber={blockNumber}
        />
      </div>
    </div>
  );
};

export default TopBar;
