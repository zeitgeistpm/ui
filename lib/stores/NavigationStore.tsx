import {
  isNavigationGroup,
  isNavigationSingleItem,
  NavigationGroup,
  NavigationItem,
  NavigationSingleItem,
  PageName,
} from "lib/types/navigation";
import { action, makeAutoObservable } from "mobx";
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  BarChart2,
  Box,
  Briefcase,
  Droplet,
  PlusSquare,
  Settings,
  User,
  Users,
} from "react-feather";
import Store, { useStore } from "./Store";

export default class NavigationStore {
  currentGroup: string | null = null;
  currentPage: PageName;

  items: Record<string, NavigationSingleItem> = {
    markets: {
      label: "Markets",
      href: "/markets",
      IconComponent: BarChart2,
      pageName: "markets",
    },
    create: {
      label: "Create Market",
      IconComponent: PlusSquare,
      href: "/create",
      pageName: "create",
    },
    portfolio: {
      label: "Portfolio",
      href: "/portfolio",
      IconComponent: Briefcase,
      pageName: "portfolio",
    },
    settings: {
      label: "Settings",
      href: "/settings",
      IconComponent: Settings,
      pageName: "settings",
    },
    avatar: {
      label: "Avatar and Badges",
      href: "/avatar",
      IconComponent: User,
      pageName: "avatar",
    },
    liquidity: {
      label: "Liquidity Pools",
      IconComponent: Droplet,
      href: "/liquidity",
      pageName: "liquidity",
      mobile: true,
    },
    activity: {
      label: "Activity Feed",
      IconComponent: Box,
      href: "/activity",
      pageName: "activity",
    },
    court: {
      label: "Court",
      IconComponent: Users,
      href: "/court",
      pageName: "court",
    },
  };

  selectGroup(group: string) {
    if (this.currentGroup === group) {
      return;
    }

    if (this.currentGroup) {
      const currItem = this.items[this.currentGroup];
      if (isNavigationGroup(currItem)) {
        currItem.selected = false;
      }
    }

    const newItem = this.items[group];
    if (isNavigationGroup(newItem)) {
      newItem.selected = true;
      this.currentGroup = group;
    }
  }

  groupHasActiveSubItem(group: string): boolean {
    const currItem = this.items[group];
    if (isNavigationGroup(currItem)) {
      return currItem.subItems.some(
        (item) => item.pageName === this.currentPage,
      );
    } else {
      return false;
    }
  }

  toggleGroupOpen(group: string) {
    const g = this.items[group];
    if (isNavigationGroup(g)) {
      g.open = !g.open;
    }
  }

  setCurrentGroupOpenState(open: boolean) {
    const g = this.items[this.currentGroup];
    if (isNavigationGroup(g)) {
      g.open = open;
    }
  }

  closeAndDeselectGroups() {
    const groups = Object.keys(this.items).reduce<NavigationGroup[]>(
      (acc, curr) => {
        const item = this.items[curr];
        if (isNavigationGroup(item)) {
          return [...acc, item];
        }
        return [...acc];
      },
      [],
    );

    groups.forEach((g) => {
      g.open = false;
      g.selected = false;
    });
    this.currentGroup = null;
  }

  getGroup(name: string): NavigationGroup | null {
    const g = this.items[name];
    if (isNavigationGroup(g)) {
      return g;
    }
    return null;
  }

  checkPage(page: PageName): boolean {
    return page === this.currentPage;
  }

  setPage(page: PageName) {
    this.currentPage = page;
  }

  constructor(private store: Store) {
    makeAutoObservable(this, {
      setPage: action,
      selectGroup: action,
      toggleGroupOpen: action,
      closeAndDeselectGroups: action,
    });
  }

  initialize(url: string) {
    if (url === "/") {
      this.selectGroup("markets");
      this.setPage("index");
      return;
    }
    const itemNames = Object.keys(this.items);

    for (const itemName of itemNames) {
      const item = this.items[itemName];
      if (isNavigationGroup(item)) {
        for (const subItem of item.subItems) {
          if (subItem.pageName === "index") {
            continue;
          }
          if (subItem.href.startsWith(url)) {
            this.selectGroup(itemName);
            this.toggleGroupOpen(itemName);
            this.setPage(subItem.pageName);
            return;
          }
        }
      }
      if (isNavigationSingleItem(item)) {
        if (item.href.startsWith(url)) {
          this.setPage(item.pageName);
          return;
        }
      }
    }
  }
}

export const useNavigationStore = () => {
  const store = useStore();
  return store.navigationStore;
};
