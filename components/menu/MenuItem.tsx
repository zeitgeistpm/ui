import { useState } from "react";
import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";
import { observer } from "mobx-react";
import Link from "next/link";
import React, { FC, useMemo } from "react";
import { Icon, ChevronUp } from "react-feather";

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

const WrapComponent: FC<{ href: string }> = ({ children, href }) => {
  return href == null ? (
    <>{children}</>
  ) : (
    <Link href={href} scroll={true}>
      {children}
    </Link>
  );
};

export const MenuItem: FC<MenuItemProps> = observer(
  ({
    IconComponent,
    textLabel,
    className = "",
    hideLabel,
    href,
    active = false,
    open,
    onClick,
  }) => {
    const { pathname } = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    active = pathname === "/" ? false : active;

    return (
      <WrapComponent href={href}>
        <div
          className={`flex rounded-full p-5 w-[68px] ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
          style={{
            border: isHovered
              ? "solid 2px #FAB400"
              : active
              ? "solid 2px #0001FE"
              : "solid 2px #000",
            transition: "all 250ms ease",
            backgroundColor: isHovered ? "#000" : active ? "#0001FE" : "#000",
          }}
        >
          <div className="relative center">
            <IconComponent
              size={24}
              style={{
                color: isHovered ? "#FAB400" : "#FFF",
                transition: "all 250ms ease",
              }}
              className=""
            />
            <div
              className={`absolute left-14 whitespace-nowrap px-2.5 py-1 rounded bg-sunglow-2 text-black text-lg `}
              style={{
                visibility: isHovered ? "visible" : "hidden",
                opacity: isHovered ? 1 : 0,
                transition: "all 250ms ease",
              }}
            >
              {textLabel}
            </div>
          </div>
        </div>
      </WrapComponent>
    );
  },
);
