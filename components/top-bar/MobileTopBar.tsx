import { FC, useEffect, useState } from "react";
import { Menu, X } from "react-feather";
import MenuLogo from "components/menu/MenuLogo";
import { useRouter } from "next/router";
import { Compact } from "@polkadot/types";
import { BlockNumber } from "@polkadot/types/interfaces";
import { NavbarColor } from "./index";
import MobileMenu from "components/menu/MobileMenu";

const MobileTopBar: FC<{
  pathname: string;
  menuOpen: boolean;
  setMenuOpen: (boolean) => void;
  navbar: NavbarColor;
  blockNumber: Compact<BlockNumber>;
}> = ({ pathname, menuOpen, setMenuOpen, navbar, blockNumber }) => {
  return (
    <div className="flex items-center w-full">
      <MenuLogo
        pathname={pathname}
        blockNumber={blockNumber}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      {menuOpen ? (
        <X
          className="ml-auto cursor-pointer text-white"
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
          className="ml-auto cursor-pointer"
          onClick={() => setMenuOpen(true)}
        />
      )}
      <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </div>
  );
};

export default MobileTopBar;
