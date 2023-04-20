import AccountButton from "components/account/AccountButton";
import { FC } from "react";
import Navigation from "./Navigation";
import { NAVIGATION_ITEMS } from "./navigation-items";

const MobileMenu: FC<{ menuOpen: boolean; setMenuOpen: (boolean) => void }> = ({
  menuOpen,
  setMenuOpen,
}) => {
  return (
    <div
      className={`${
        menuOpen ? "translate-y-[70px]" : "translate-y-[-860px]"
      } md:hidden container-fluid transition-all duration-300 ease-in fixed top-0 left-0 w-full h-[calc(100vh-70px)] z-30 flex flex-col justify-between items-center text-black`}
    >
      <div className="flex flex-col justify-between items-center gap-7 pt-10">
        <Navigation
          navigation={NAVIGATION_ITEMS}
          mobile={true}
          setMenuOpen={setMenuOpen}
        />
      </div>
    </div>
  );
};

export default MobileMenu;
