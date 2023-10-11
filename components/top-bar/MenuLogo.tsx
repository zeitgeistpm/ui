import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  return (
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
