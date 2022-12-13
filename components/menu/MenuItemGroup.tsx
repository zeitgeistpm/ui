import { AnimatePresence, motion } from "framer-motion";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import React, { FC, useEffect, useRef } from "react";
import { MenuItem } from "./MenuItem";
import SubMenuItem from "./SubMenuItem";

export interface MenuItemGroupProps {
  groupName: string;
  hideLabel: boolean;
  className?: string;
}

const PopoutMenu = observer(({ groupName }: { groupName: string }) => {
  const navigationStore = useNavigationStore();
  const group = navigationStore.getGroup(groupName);
  const menuRef = useRef<HTMLDivElement>();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        navigationStore.toggleGroupOpen(groupName);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div
      ref={menuRef}
      className="flex flex-col absolute w-ztg-200 left-28 -mt-ztg-56 z-ztg-2 bg-sky-100 shadow-md dark:bg-black rounded-ztg-10"
    >
      <div className=" pl-ztg-22 py-ztg-18 text-ztg-16-150 font-bold text-black dark:text-white border-b-1 border-sky-600">
        {group.label}
      </div>
      <div className="b0 rounded-b-ztg-10">
        {group.subItems.map((item, idx) => {
          return (
            <SubMenuItem
              label={item.label}
              href={item.href}
              key={`menuItemGroup${idx}`}
              active={navigationStore.checkPage(item.pageName)}
              onClick={() => {
                navigationStore.setPage(item.pageName);
                navigationStore.toggleGroupOpen(groupName);
              }}
              detail=""
              showDot={false}
            />
          );
        })}
      </div>
    </div>
  );
});

export const MenuItemGroup: FC<MenuItemGroupProps> = observer(
  ({ groupName, hideLabel, className = "" }) => {
    const navigationStore = useNavigationStore();
    const store = useStore();
    const group = navigationStore.getGroup(groupName);

    useEffect(() => {
      if (navigationStore.currentGroup === groupName && !group.selected) {
        navigationStore.toggleGroupOpen(groupName);
      }
    }, [navigationStore.currentGroup]);

    const clickGroup = () => {
      if (navigationStore.currentGroup !== groupName) {
        // We may add this back when there are more items in the left drawer
        // navigationStore.closeAndDeselectGroups();
        navigationStore.selectGroup(groupName);
        navigationStore.toggleGroupOpen(groupName);
      } else {
        navigationStore.toggleGroupOpen(groupName);
      }
    };

    return (
      <div className={className}>
        <MenuItem
          IconComponent={group.IconComponent}
          hideLabel={hideLabel}
          onClick={() => {
            clickGroup();
          }}
          open={navigationStore.getGroup(groupName).open}
          active={navigationStore.groupHasActiveSubItem(groupName)}
        >
          {group.label}
        </MenuItem>
        <AnimatePresence>
          {navigationStore.getGroup(groupName).open &&
            (store.leftDrawerClosed === true ? (
              <PopoutMenu groupName={groupName} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                exit={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "tween" }}
                className="flex flex-col"
              >
                {group.subItems.map((item, idx) => {
                  return (
                    <SubMenuItem
                      label={item.label}
                      href={item.href}
                      key={`menuItemGroup${idx}`}
                      active={navigationStore.checkPage(item.pageName)}
                      onClick={() => {
                        navigationStore.setPage(item.pageName);
                      }}
                      detail=""
                    />
                  );
                })}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    );
  },
);
