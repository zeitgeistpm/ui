import { FC, useEffect, useState } from "react";
import { Menu, X } from "react-feather";
import MenuLogo from "components/menu/MenuLogo";
import { useRouter } from "next/router";
import { Compact } from "@polkadot/types";
import { BlockNumber } from "@polkadot/types/interfaces";
import { NavbarColor } from "./index";

const MobileTopBar: FC<{
  navbar: NavbarColor;
  setNavBarBG: (NavbarColor) => void;
  blockNumber: Compact<BlockNumber>;
}> = ({ navbar, setNavBarBG, blockNumber }) => {
  const { pathname } = useRouter();

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  const handleMenuClick = () => {
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
      setNavBarBG("white");
    } else {
      setNavBarBG("black");
    }
  }, [menuOpen]);

  return (
    <div className="flex items-center w-full">
      <MenuLogo pathname={pathname} blockNumber={blockNumber} />
      {menuOpen ? (
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
};

export default MobileTopBar;
