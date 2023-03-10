import React, { useEffect, useState } from "react";
import SideMenu from "./SideMenu";
import MobileMenu from "components/menu/MobileMenu";
import { Menu, X } from "react-feather";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import MenuLogo from "components/menu/MenuLogo";

export type NavbarColor = "black" | "white" | "transparent";

const AccountButton = dynamic(() => import("../account/AccountButton"), {
  ssr: false,
});

const TopBar = () => {
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
      className={`w-full py-7 fixed z-40 transition-all duration-300 bg-${navbarBGColor} ${
        pathname === "/" ? "border-0" : "border-b border-gray-200"
      }`}
    >
      <div className="relative flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto px-8">
        <SideMenu />
        <MenuLogo pathname={pathname} menuOpen={menuOpen} />
        {/* <MarketSearch /> */}
        <AccountButton />
        {menuOpen ? (
          <X
            className="block md:hidden ml-auto cursor-pointer text-white"
            color={`${
              pathname === "/" ? (menuOpen ? "black" : "white") : "black"
            }`}
            onClick={() => setMenuOpen(false)}
          />
        ) : (
          <Menu
            color={`${
              pathname === "/" ? (menuOpen ? "black" : "white") : "black"
            }`}
            className="block md:hidden ml-auto cursor-pointer"
            onClick={() => setMenuOpen(true)}
          />
        )}
      </div>
      <MobileMenu menuOpen={menuOpen} />
    </div>
  );
};

export default TopBar;
