import React, { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import Logo from "../icons/ZeitgeistIcon";
import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";

const MenuLogo: FC<{
  menuOpen: boolean;
  setMenuOpen?: (boolean) => void;
}> = observer(({ menuOpen, setMenuOpen }) => {
  const { pathname } = useRouter();
  const { blockNumber } = useStore();

  return (
    <Link
      onClick={() => setMenuOpen(false)}
      className="flex flex-1 items-center gap-4"
      href="/"
      role="button"
    >
      <Logo dark={pathname === "/" ? (menuOpen ? true : false) : true} />
      <>
        <div className="flex flex-col items-center">
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
          <span className="w-full text-start text-xs font-mono text-sky-600">
            <>{blockNumber ? blockNumber.toHuman() : 0}</>
          </span>
        </div>
      </>
    </Link>
  );
});

export default MenuLogo;
