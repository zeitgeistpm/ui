import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";
import { isWSX } from "lib/constants";
import Image from "next/image";

const MenuLogo: FC<{}> = () => {
  return isWSX ? (
    <Image
      className="hidden sm:block invert"
      src="/wsx/wsx-logo-header.svg"
      alt="Washington Stock Exchange logo"
      width={247}
      height={106}
    />
  ) : (
    <div className="flex items-center gap-4">
      <Logo variant={"light"} />
      <>
        <div className="hidden md:flex flex-col">
          <h1 className={`font-kanit text-white text-xl `}>Zeitgeist</h1>
        </div>
      </>
    </div>
  );
};

export default MenuLogo;
