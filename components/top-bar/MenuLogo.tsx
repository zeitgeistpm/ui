import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  return (
    <div className="group relative flex items-center gap-2 md:gap-4 shrink-0">
      {/* Default state: Zeitgeist Logo and Text */}
      <div className="flex items-center gap-2 md:gap-4 transition-opacity duration-300 group-hover:opacity-0 opacity-100">
        <div className="relative scale-110 md:scale-125 shrink-0 w-[33px] md:w-auto">
          <Logo variant={"light"} />
        </div>
        <div className="hidden flex-col md:flex">
          <h1 className="font-kanit text-2xl font-semibold text-white whitespace-nowrap">
            Zeitgeist
          </h1>
        </div>
      </div>
      
      {/* Hover state: Halcyon Logo - positioned absolutely to replace everything */}
      {/* Mobile: halcyon-04 (when text is hidden), Desktop: halcyon-03 (when text is visible) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none z-0">
        {/* Mobile: halcyon-04 - square logo matching Zeitgeist logo dimensions */}
        <img
          src="/halcyon-04.svg"
          alt="Halcyon"
          className="h-[33px] w-[33px] md:hidden object-contain"
        />
        {/* Desktop: halcyon-03 - full logo with text */}
        <img
          src="/halcyon-03.svg"
          alt="Halcyon"
          className="hidden md:block h-[37.5px] w-auto md:max-w-none object-contain"
        />
      </div>
    </div>
  );
};

export default MenuLogo;
