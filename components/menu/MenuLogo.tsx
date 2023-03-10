import React, { FC } from "react";
import Link from "next/link";
import Logo from "../icons/ZeitgeistIcon";
import { Compact } from "@polkadot/types";
import { BlockNumber } from "@polkadot/types/interfaces";
import { useStore } from "lib/stores/Store";

const MenuLogo: FC<{
  pathname: string;
  menuOpen: boolean;
  setMenuOpen?: (boolean) => void;
}> = ({ pathname, menuOpen, setMenuOpen }) => {
  const { blockNumber } = useStore();
  console.log(blockNumber as Compact<BlockNumber>);
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
            className={`font-bold font-kanit text-xl ${
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
            {blockNumber ? blockNumber.toHuman() : 0}
          </span>
        </div>
      </>
    </Link>
  );
};

export default MenuLogo;
