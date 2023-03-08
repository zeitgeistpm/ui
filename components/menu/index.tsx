import { observer } from "mobx-react";
import React, { FC, useState } from "react";
import {
  initializeNavigation,
  useNavigationStore,
} from "lib/stores/NavigationStore";
import { PageName } from "lib/types/navigation";
import { MenuItem } from "./MenuItem";

const Menu: FC = observer(() => {
  const navigationStore = useNavigationStore();
  initializeNavigation();

  const navigate = (page: PageName) => {
    navigationStore.setPage(page);
    // We may add this back when there are more items in the left drawer
    // navigationStore.closeAndDeselectGroups();
  };

  return (
    <>
      <div className="hidden fixed left-4 top-32 md:flex flex-col gap-5 z-50">
        {Object.keys(navigationStore.items)
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
            const item = navigationStore.items[itemKey];
            return (
              <MenuItem
                href={item.href}
                IconComponent={item.IconComponent}
                textLabel={item.label}
                active={navigationStore.checkPage(itemKey as any)}
                className=""
                onClick={() => navigate(itemKey as any)}
                key={`meuItem-${idx}`}
              />
            );
          })}
      </div>
    </>
  );
});

export default Menu;
