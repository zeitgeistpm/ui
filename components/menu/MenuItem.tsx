import { motion, Variants } from "framer-motion";
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
    const store = useStore();

    return (
      <WrapComponent href={href}>
        <div
          className={`flex bg-black rounded-full p-5 ${className}`}
          onClick={onClick}
        >
          <div className="center">
            <IconComponent size={24} className="text-white" />
          </div>
          <div className="text-white pl-5">{textLabel}</div>
        </div>
      </WrapComponent>
    );
  },
);
