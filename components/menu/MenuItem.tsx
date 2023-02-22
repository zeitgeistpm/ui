import { useState } from "react";
import { useStore } from "lib/stores/Store";
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
    const [isHovered, setIsHovered] = useState(false);

    return (
      <WrapComponent href={href}>
        <div
          className={`flex bg-black rounded-full p-5 ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
          style={{
            maxWidth: isHovered ? "250px" : "68px",
            border:
              isHovered || active ? "solid 2px #FAB400" : "solid 2px #000",
            transition: "all 500ms ease",
          }}
        >
          <div className="center">
            <IconComponent
              size={24}
              style={{ color: isHovered || active ? "#FAB400" : "#FFF" }}
              className=""
            />
          </div>
          <div
            className={`whitespace-nowrap	pl-5`}
            style={{
              visibility: isHovered ? "visible" : "hidden",
              color: isHovered ? "#FAB400" : "#FFF",
              opacity: isHovered ? 1 : 0,
              transition: "all 250ms ease",
            }}
          >
            {textLabel}
          </div>
        </div>
      </WrapComponent>
    );
  },
);
