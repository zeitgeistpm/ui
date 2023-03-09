import React from "react";
import { NAVIGATION_ITEMS } from "./navigation-items";
import Navigation from "./Navigation";
import { useRouter } from "next/router";

const Menu = () => {
  return (
    <nav className="hidden fixed left-4 top-32 md:flex flex-col gap-5 z-50">
      <Navigation navigation={NAVIGATION_ITEMS} />
    </nav>
  );
};

export default Menu;
