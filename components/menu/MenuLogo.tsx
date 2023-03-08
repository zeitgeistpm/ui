import React, { FC } from "react";
import Link from "next/link";
import Logo from "../icons/ZeitgeistIcon";
import { Compact } from "@polkadot/types";
import { BlockNumber } from "@polkadot/types/interfaces";

const MenuLogo: FC<{ pathname: string; blockNumber: Compact<BlockNumber> }> = ({
  pathname,
  blockNumber,
}) => {
  return (
    <Link className="flex flex-1 items-center gap-4" href="/" role="button">
      <Logo dark={pathname === "/" ? false : true} />
      <>
        <div className="flex flex-col items-center">
          <h1
            className={`font-bold font-kanit text-xl ${
              pathname === "/" ? "text-white" : "text-black"
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
