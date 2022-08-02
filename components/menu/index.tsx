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

  const createItem = navigationStore.items.create as NavigationSingleItem;
  const liquidityItem = navigationStore.items.liquidity as NavigationSingleItem;
  const activityItem = navigationStore.items.activity as NavigationSingleItem;
  const courtItem = navigationStore.items.court as NavigationSingleItem;

  const hideLabels = store.leftDrawerClosed;

  const navigate = (page: PageName) => {
    navigationStore.setPage(page);
    // We may add this back when there are more items in the left drawer
    // navigationStore.closeAndDeselectGroups();
  };

  return (
    <>
      <div className="flex flex-col">
        <MenuItemGroup
          groupName="markets"
          hideLabel={hideLabels}
          className="mt-ztg-32 mb-ztg-12"
        />
        <MenuItem
          href={createItem.href}
          IconComponent={createItem.IconComponent}
          hideLabel={hideLabels}
          active={navigationStore.checkPage("create")}
          className="mb-ztg-12"
          onClick={() => {
            navigate("create");
          }}
        >
          {createItem.label}
        </MenuItem>
        <MenuItemGroup
          groupName="account"
          hideLabel={hideLabels}
          className="mb-ztg-12"
        />
        <MenuItem
          href={liquidityItem.href}
          IconComponent={liquidityItem.IconComponent}
          hideLabel={hideLabels}
          active={navigationStore.checkPage(liquidityItem.pageName)}
          className="mb-ztg-12"
          onClick={() => {
            navigate(liquidityItem.pageName);
          }}
        >
          {liquidityItem.label}
        </MenuItem>
        {process.env.NEXT_PUBLIC_SHOW_COURT === "true" ? (
          <MenuItem
            href={courtItem.href}
            IconComponent={courtItem.IconComponent}
            hideLabel={hideLabels}
            active={navigationStore.checkPage(courtItem.pageName)}
            className="mb-ztg-12"
            onClick={() => {
              navigate(courtItem.pageName);
            }}
          >
            {courtItem.label}
          </MenuItem>
        ) : (
          <></>
        )}
        {/* <MenuItem
          href={activityItem.href}
          IconComponent={activityItem.IconComponent}
          hideLabel={hideLabels}
          active={navigationStore.checkPage(activityItem.pageName)}
          className="mb-ztg-12"
          onClick={() => {
            navigate(activityItem.pageName);
          }}
        >
          {activityItem.label}
        </MenuItem> */}
      </div>
      <div className="mt-auto">
        {/* <LocalizationSelect
          options={localizationOptions}
          selectedLanguage={selectedLanguage}
          className={`${
            store.leftDrawerClosed === true ? "ml-ztg-33 " : "ml-ztg-39"
          }  mb-ztg-20`}
          hideLabel={hideLabels}
          onLanguageChange={(option: LocalizationOption) =>
            setSelectedLanguage(option)
          }
        /> */}
        <ThemeSwitch className="ml-ztg-33 mb-ztg-24" />
        <div className="ml-ztg-42 mb-ztg-22 text-ztg-12-150">v.1.0.0</div>
      </div>
    </>
  );
});

export default Menu;
