import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  const { pathname } = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Logo dark={false} />
      <>
        <div className="hidden md:flex flex-col">
          <h1 className={`font-kanit text-white text-xl `}>Zeitgeist</h1>
        </div>
      </>
    </div>
  );
};

export default MenuLogo;
