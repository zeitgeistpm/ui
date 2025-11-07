import { useRouter } from "next/router";
import Link from "next/link";
import React, { FC, PropsWithChildren } from "react";
import { Icon } from "react-feather";

export interface MenuItemMobileProps {
  textLabel?: string;
  href: string;
  active?: boolean;
  open?: boolean;
  setMenuOpen?: (boolean) => void;
}

export interface MenuItemProps extends MenuItemMobileProps {
  IconComponent: Icon;
}

const WrapComponent: FC<PropsWithChildren<{ href: string }>> = ({
  children,
  href,
}) => {
  return href == null ? <>{children}</> : <Link href={href}>{children}</Link>;
};

export const MenuItem: FC<PropsWithChildren<MenuItemProps>> = ({
  IconComponent,
  textLabel,
  href,
  active = false,
}) => {
  const { pathname } = useRouter();
  active = pathname === "/" ? false : active;

  return (
    <WrapComponent href={href}>
      <button
        className={`border-b-2lack group flex w-[68px] rounded-full border-2 bg-black p-5 text-white transition-all duration-300 hover:border-sunglow-2 hover:bg-black hover:text-sunglow-2 focus:border-ztg-blue focus:bg-ztg-blue focus:text-white ${
          active && "border-ztg-blue bg-ztg-blue"
        }`}
      >
        <div className="center relative">
          <IconComponent size={24} />
          <div className="invisible absolute left-14 whitespace-nowrap rounded bg-sunglow-2 px-2.5 py-1 text-lg text-black opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-focus:bg-ztg-blue group-focus:text-white">
            {textLabel}
          </div>
        </div>
      </button>
    </WrapComponent>
  );
};

export const MenuItemMobile: FC<MenuItemMobileProps> = ({
  textLabel,
  href,
  setMenuOpen,
}) => {
  return (
    <WrapComponent href={href}>
      <button
        className="center flex flex-col"
        onClick={() => setMenuOpen && setMenuOpen(false)}
      >
        <div className="whitespace-nowrap text-lg text-black">{textLabel}</div>
      </button>
    </WrapComponent>
  );
};
