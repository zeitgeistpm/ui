import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";
import { isNTT } from "lib/constants";
import Image from "next/image";

const MenuLogo: FC<{}> = () => {
  return isNTT ? (
    <Image
      className="hidden sm:block"
      src="/ntt/logo.svg"
      alt="NTT Global logo"
      width={140}
      height={50}
    />
  ) : (
    <div className="flex items-center gap-4">
      <Logo variant={"light"} />
      <>
        <div className="hidden flex-col md:flex">
          <h1 className={`font-kanit text-xl text-white `}>Zeitgeist</h1>
        </div>
      </>
    </div>
  );
};

export default MenuLogo;
