import { FC } from "react";
import Logo from "../icons/ZeitgeistIcon";

const MenuLogo: FC<{}> = () => {
  return (
    <div className="flex items-center gap-4">
      <Logo variant={"light"} />
      <>
        <div className="hidden flex-col md:flex">
          <h1 className={`w-[500px] font-kanit text-xl text-blue-500 `}>
            {navigator.userAgent}
          </h1>
        </div>
      </>
    </div>
  );
};

export default MenuLogo;
