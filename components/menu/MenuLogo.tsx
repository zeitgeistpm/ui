import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{
  menuOpen: boolean;
  setMenuOpen?: (boolean) => void;
}> = ({ menuOpen, setMenuOpen }) => {
  const { pathname } = useRouter();

  return (
    <Link
      onClick={() => setMenuOpen && setMenuOpen(false)}
      className="flex items-center gap-4"
      href="/"
      role="button"
    >
      <Logo dark={pathname === "/" ? (menuOpen ? true : false) : true} />
      <>
        <div className="hidden sm:flex flex-col">
          <h1
            className={`font-kanit text-xl ${
              pathname === "/"
                ? menuOpen
                  ? "text-black"
                  : "text-white"
                : "text-black"
            }`}
          >
            Zeitgeist
          </h1>
          <span className="text-xs text-sky-600 font-medium">
            Prediction Markets
          </span>
        </div>
      </>
    </Link>
  );
};

export default MenuLogo;
