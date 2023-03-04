import { observer } from "mobx-react";
import React, { FC, useState } from "react";
import {
  initializeNavigation,
  useNavigationStore,
} from "lib/stores/NavigationStore";
import { NavigationSingleItem, PageName } from "lib/types/navigation";
import ThemeSwitch from "./ThemeSwitch";
import LocalizationSelect, {
  LocalizationOption,
  localizationOptions,
} from "./LocalizationSelect";
import { MenuItem } from "./MenuItem";
import { MenuItemGroup } from "./MenuItemGroup";
import { useStore } from "lib/stores/Store";

const Menu: FC = observer(() => {
  const [selectedLanguage, setSelectedLanguage] = useState<LocalizationOption>(
    localizationOptions[0],
  );
  const navigationStore = useNavigationStore();
  const store = useStore();
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
      {/* TODO: check to see if code below can be deleted
      <div className="mt-auto">
        <LocalizationSelect
          options={localizationOptions}
          selectedLanguage={selectedLanguage}
          className={`${
            store.leftDrawerClosed === true ? "ml-ztg-33 " : "ml-ztg-39"
          }  mb-ztg-20`}
          hideLabel={hideLabels}
          onLanguageChange={(option: LocalizationOption) =>
            setSelectedLanguage(option)
          }
        />
        <ThemeSwitch className="ml-ztg-33 mb-ztg-24" />
        <div className="ml-ztg-42 mb-ztg-22 text-ztg-12-150">v.1.0.0</div>
      </div> */}
    </>
  );
});

export default Menu;
