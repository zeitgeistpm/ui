import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  return (
    <div className="group relative flex shrink-0 items-center gap-2 md:gap-4">
      {/* Zeitgeist Logo and Text */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative w-[33px] shrink-0 scale-110 md:w-auto md:scale-125 [&_svg_path]:transition-colors [&_svg_path]:duration-300 group-hover:[&_svg_path]:fill-ztg-green-500">
          <Logo variant={"light"} />
        </div>
        <div className="hidden flex-col md:flex">
          <h1 className="whitespace-nowrap font-kanit text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-ztg-green-500">
            Zeitgeist
          </h1>
        </div>
      </div>
    </div>
  );
};

export default MenuLogo;
