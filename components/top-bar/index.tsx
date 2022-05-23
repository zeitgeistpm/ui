import { observer } from "mobx-react";
import React from "react";

import AccountButton from "../account/AccountButton";
import MarketSearch from "./MarketSearch";
import Logo from "../icons/ZeitgeistIcon";
import { Menu, X } from "react-feather";
import { useStore } from "lib/stores/Store";

const MobileTopBar = observer(() => {
  const store = useStore();

  const handleMenuClick = () => {
    store.toggleShowMobileMenu();
  };

  return (
    <div className="flex items-center w-full">
      <Logo />
      <h1 className="text-ztg-19-120 ml-ztg-10 font-bold font-kanit text-black dark:text-white">
        Zeitgeist
      </h1>
      {store.showMobileMenu ? (
        <X
          className="ml-auto cursor-pointer dark:text-white"
          onClick={handleMenuClick}
        />
      ) : (
        <Menu
          className="ml-auto cursor-pointer dark:text-white"
          onClick={handleMenuClick}
        />
      )}
    </div>
  );
});

const TopBar = observer(() => {
  return (
    <div className="topbar flex w-full px-ztg-32 py-ztg-18 bg-white dark:bg-sky-1000 sticky top-0 z-ztg-2 shadow-md dark:shadow-2xl">
      <div className="hidden sm:flex justify-between h-full w-full">
        <MarketSearch />
        <div className="flex h-full items-center">
          <AccountButton />
        </div>
      </div>
      <div className="sm:hidden w-full">
        <MobileTopBar />
      </div>
    </div>
  );
});

export default TopBar;
