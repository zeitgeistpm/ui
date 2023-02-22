import { observer } from "mobx-react";
import React, { useEffect, useState, FC } from "react";

import AccountButton from "../account/AccountButton";
import MarketSearch from "./MarketSearch";
import Logo from "../icons/ZeitgeistIcon";
import { Menu, X } from "react-feather";
import Link from "next/link";
import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";

const MobileTopBar: FC<{ navbar: boolean }> = observer(({ navbar }) => {
  const store = useStore();

  const handleMenuClick = () => {
    store.toggleShowMobileMenu();
  };

  return (
    <div className="flex items-center w-full">
      <Logo dark={navbar} />
      <h1
        className={`text-ztg-19-120 ml-ztg-10 font-bold font-kanit ${
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
  const [navbar, setNavbar] = useState(false);

  const changeNavBG = () => {
    if (window.scrollY >= 60) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };

  useEffect(() => {
    changeNavBG();
    window.addEventListener("scroll", changeNavBG);
  });

  return (
    <div
      className={`flex w-full py-ztg-18 bg-transparent fixed z-ztg-10`}
      style={{
        backgroundColor: `${navbar ? "white" : "transparent"}`,
      }}
    >
      <div className="hidden sm:flex justify-between items-center h-full min-w-full topbar container-fluid mx-4">
        <Link
          className="flex mx-ztg-30 mt-ztg-20 h-ztg-35 mb-ztg-36"
          href="/"
          role="button"
        >
          <Logo />
        </Link>
        <MarketSearch />
        <div className="flex h-full items-center">
          <AccountButton />
        </div>
      </div>
      <div className="sm:hidden w-full container-fluid">
        <MobileTopBar navbar={navbar} />
      </div>
    </div>
  );
});

export default TopBar;
