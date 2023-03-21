import React from "react";
import { NAVIGATION_ITEMS } from "./navigation-items";
import Navigation from "./Navigation";

const SideMenu = () => {
  return (
    <nav className="hidden absolute left-4 top-28 md:flex flex-col gap-5 z-50">
      <Navigation navigation={NAVIGATION_ITEMS} mobile={false} />
    </nav>
  );
};

export default SideMenu;
