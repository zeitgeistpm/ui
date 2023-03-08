import { useRouter } from "next/router";
import { observer } from "mobx-react";
import Link from "next/link";
import React, { FC } from "react";

export interface MenuItemMobileProps {
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
  ({ textLabel, className = "", href, active = false, onClick }) => {
    const { pathname } = useRouter();
    active = pathname === "/" ? false : active;

    return (
      <WrapComponent href={href}>
        <button className={`${className}`} onClick={onClick}>
          <div className="flex flex-col center">
            <div className="whitespace-nowrap text-black text-lg">
              {textLabel}
            </div>
          </div>
        </button>
      </WrapComponent>
    );
  },
);
