import { observer } from "mobx-react";
import React, { FC, useState } from "react";
import {
  initializeNavigation,
  useNavigationStore,
} from "lib/stores/NavigationStore";
import { NavigationSingleItem, PageName } from "lib/types/navigation";
import LocalizationSelect, {
  LocalizationOption,
  localizationOptions,
} from "./LocalizationSelect";
import { MenuItem } from "./MenuItem";
import { useStore } from "lib/stores/Store";

const Menu: FC = observer(() => {
  const [selectedLanguage, setSelectedLanguage] = useState<LocalizationOption>(
    localizationOptions[0],
  );
  const navigationStore = useNavigationStore();
  const store = useStore();
  initializeNavigation();

  const hideLabels = store.leftDrawerClosed;

  const navigate = (page: PageName) => {
    navigationStore.setPage(page);
    // We may add this back when there are more items in the left drawer
    // navigationStore.closeAndDeselectGroups();
  };

  return (
    <>
      <div className="hidden md:flex flex-col gap-5 z-50 md:mt-5 md:ml-4">
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
                hideLabel={hideLabels}
                active={navigationStore.checkPage(itemKey as any)}
                className="pointer-events-auto"
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
