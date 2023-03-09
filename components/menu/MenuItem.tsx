import { useRouter } from "next/router";
import { observer } from "mobx-react";
import Link from "next/link";
import React, { FC, PropsWithChildren } from "react";
import { Icon } from "react-feather";

export interface MenuItemProps {
  hideLabel: boolean;
  IconComponent: Icon;
  textLabel?: string;
  className?: string;
  href?: string;
  active?: boolean;
  open?: boolean;
  onClick: () => void;
}

const WrapComponent: FC<PropsWithChildren<{ href: string }>> = ({
  children,
  href,
}) => {
  return href == null ? <>{children}</> : <Link href={href}>{children}</Link>;
};

export const MenuItem: FC<PropsWithChildren<MenuItemProps>> = observer(
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
          className={`group flex rounded-full p-5 w-[68px] bg-black border-2 border-black text-white hover:border-sunglow-2 hover:text-sunglow-2 hover:bg-black transition-all duration-300 focus:bg-ztg-blue focus:text-white focus:border-ztg-blue ${
            active && "bg-ztg-blue border-ztg-blue"
          } ${className}`}
          onClick={onClick}
        >
          <div className="relative center">
            <IconComponent size={24} />
            <div className="invisible opacity-0 absolute left-14 whitespace-nowrap px-2.5 py-1 rounded bg-sunglow-2 text-black text-lg group-hover:visible group-hover:opacity-100 group-focus:bg-ztg-blue group-focus:text-white transition-all duration-300">
              {textLabel}
            </div>
          </div>
        </button>
      </WrapComponent>
    );
  },
);
