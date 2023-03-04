import { useRouter } from "next/router";
import { observer } from "mobx-react";
import Link from "next/link";
import React, { FC } from "react";
import { Icon } from "react-feather";

export interface MenuItemMobileProps {
  IconComponent: Icon;
  textLabel?: string;
  className?: string;
  href?: string;
  active?: boolean;
  open?: boolean;
  onClick: () => void;
}

const WrapComponent: FC<{ href: string }> = ({ children, href }) => {
  return href == null ? <>{children}</> : <Link href={href}>{children}</Link>;
};

export const MenuItemMobile: FC<MenuItemMobileProps> = observer(
  ({
    IconComponent,
    textLabel,
    className = "",
    href,
    active = false,
    onClick,
  }) => {
    const { pathname } = useRouter();
    active = pathname === "/" ? false : active;

    return (
      <WrapComponent href={href}>
        <button
          className={`group rounded-full p-5 w-[68px] h-[68px] bg-black border-2 border-black text-white hover:border-sunglow-2 hover:text-sunglow-2 hover:bg-black transition-all duration-300 focus:bg-ztg-blue focus:text-white focus:border-ztg-blue ${
            active && "bg-ztg-blue border-ztg-blue"
          } ${className}`}
          onClick={onClick}
        >
          <div className="flex flex-col center">
            <IconComponent size={24} />
            <div className="mt-7 whitespace-nowrap text-black text-lg">
              {textLabel}
            </div>
          </div>
        </button>
      </WrapComponent>
    );
  },
);
