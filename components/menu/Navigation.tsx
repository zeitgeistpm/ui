import React, { FC } from "react";
import { MenuItem, MenuItemMobile } from "./MenuItem";
import { useRouter } from "next/router";

const Navigation: FC<{ navigation: {}; mobile: boolean }> = ({
  navigation,
  mobile,
}) => {
  const { pathname } = useRouter();
  return (
    <>
      {Object.keys(navigation)
        .filter((itemKey) => {
          // Skip court page for now...
          if (
            itemKey === "court" &&
            process.env.NEXT_PUBLIC_SHOW_COURT === "false"
          ) {
            return false;
          }
          // Skip activity feed page for now...
          if (itemKey === "activity") return false;
          return true;
        })
        .map((itemKey, idx) => {
          const item = navigation[itemKey];
          return mobile ? (
            <MenuItemMobile
              href={item.href}
              textLabel={item.label}
              active={pathname === item.href}
              className=""
              key={`meuItem-${idx}`}
            />
          ) : (
            <MenuItem
              href={item.href}
              IconComponent={item.IconComponent}
              textLabel={item.label}
              active={pathname === item.href}
              className=""
              key={`meuItem-${idx}`}
            />
          );
        })}
    </>
  );
};

export default Navigation;
