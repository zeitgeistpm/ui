import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  const { pathname } = useRouter();

  return (
    <Link className="flex items-center gap-4" href="/" role="button">
      <Logo dark={false} />
      <>
        <div className="hidden sm:flex flex-col">
          <h1 className={`font-kanit text-white text-xl `}>Zeitgeist</h1>
        </div>
      </>
    </Link>
  );
};

export default MenuLogo;
