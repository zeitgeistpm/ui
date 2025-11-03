import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  return (
    <div className="group relative flex shrink-0 items-center gap-2 md:gap-4">
      {/* Default state: Zeitgeist Logo and Text */}
      <div className="flex items-center gap-2 opacity-100 transition-opacity duration-300 group-hover:opacity-0 md:gap-4">
        <div className="relative w-[33px] shrink-0 scale-110 md:w-auto md:scale-125">
          <Logo variant={"light"} />
        </div>
        <div className="hidden flex-col md:flex">
          <h1 className="whitespace-nowrap font-kanit text-2xl font-semibold text-white">
            Zeitgeist
          </h1>
        </div>
      </div>

      {/* Hover state: Halcyon Logo - positioned absolutely to replace everything */}
      {/* Mobile: halcyon-04 (when text is hidden), Desktop: halcyon-03 (when text is visible) */}
      <div className="pointer-events-none absolute left-0 top-1/2 z-0 flex -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {/* Mobile: halcyon-04 - square logo matching Zeitgeist logo dimensions */}
        <img
          src="/halcyon-04.svg"
          alt="Halcyon"
          className="h-[33px] w-[33px] object-contain md:hidden"
        />
        {/* Desktop: halcyon-03 - full logo with text */}
        <img
          src="/halcyon-03.svg"
          alt="Halcyon"
          className="hidden h-[37.5px] w-auto object-contain md:block md:max-w-none"
        />
      </div>
    </div>
  );
};

export default MenuLogo;
