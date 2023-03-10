import { FC } from "react";
import Navigation from "./Navigation";
import { NAVIGATION_ITEMS } from "./navigation-items";

const MobileMenu: FC<{ menuOpen: boolean }> = ({ menuOpen }) => {
  return (
    <div
      className={`${
        menuOpen ? "translate-y-[100px]" : "translate-y-[-860px]"
      } md:hidden container-fluid transition-all duration-300 ease-in fixed top-0 left-0 w-full h-[calc(100vh-100px)] z-30 flex flex-col justify-between items-center bg-white text-black`}
    >
      <div className="flex flex-col justify-between items-center gap-7 pt-10">
        <Navigation navigation={NAVIGATION_ITEMS} mobile={true} />
      </div>
      <div className="p-7 text-center text-xs">
        Trading is only available on the desktop version of the application.
      </div>
    </div>
  );
};

export default MobileMenu;
