import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
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

  const changeNavBG = () => {
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
    changeNavBG();
    window.addEventListener("scroll", changeNavBG);
    return () => {
      document.removeEventListener("scroll", changeNavBG);
    };
  }, [changeNavBG]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.height = `100%`;
      document.body.style.overflow = `hidden`;
    } else {
      document.body.style.height = `auto`;
      document.body.style.overflow = `initial`;
    }
    changeNavBG();
  }, [menuOpen]);

  return (
    <div
      className={`w-full py-3.5 fixed z-40 transition-all duration-300 bg-${navbarBGColor} ${
        pathname === "/" ? "border-b-0" : "border-b border-gray-200"
      }`}
    >
      <div className="relative flex justify-between items-center w-full max-w-screen-2xl h-[44px] mx-auto px-8">
        <SideMenu />
        <MenuLogo menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        {/* <MarketSearch /> */}
        <AccountButton />
        {menuOpen ? (
          <X
            className="block md:hidden cursor-pointer text-white"
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
            className="block md:hidden cursor-pointer"
            onClick={() => setMenuOpen(true)}
          />
        )}
      </div>
      <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </div>
  );
};

export default TopBar;
