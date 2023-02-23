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
      className={`flex w-full py-7 bg-transparent fixed z-ztg-10`}
      style={{
        backgroundColor: `${navbar ? "white" : "transparent"}`,
      }}
    >
      <div className="hidden sm:flex justify-between items-center min-w-full max-w-screen-2xl h-[44px] px-8">
        <Link className="flex items-center gap-4" href="/" role="button">
          <Logo />
          <>
            <div className="flex flex-col items-center">
              <h1 className="font-bold font-kanit text-white text-xl">
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
        <MobileTopBar navbar={navbar} />
      </div>
    </div>
  );
});

export default TopBar;
