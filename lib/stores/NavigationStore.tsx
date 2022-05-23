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
  Users,
} from "react-feather";
import Store, { useStore } from "./Store";

export default class NavigationStore {
  currentGroup: string | null = null;
  currentPage: PageName;

  items: Record<string, NavigationItem> = {
    markets: {
      label: "Markets",
      IconComponent: BarChart2,
      selected: false,
      open: false,
      subItems: [
        { label: "All Markets", href: "/", pageName: "index", mobile: true },
        {
          label: "My Markets",
          href: "/markets?myMarketsOnly=true",
          pageName: "markets",
        },
      ],
    },
    account: {
      label: "My Account",
      IconComponent: Briefcase,
      selected: false,
      open: false,
      subItems: [
        {
          label: "My Portfolio",
          href: "/portfolio",
          pageName: "portfolio",
        },
        {
          label: "My Settings",
          href: "/settings",
          pageName: "settings",
        },
      ],
    },
    create: {
      label: "Create Market",
      IconComponent: PlusSquare,
      href: "/create",
      pageName: "create",
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
        (item) => item.pageName === this.currentPage
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
      []
    );

    groups.forEach((g) => {
      g.open = false;
      g.selected = false;
    });
    this.currentGroup = null;
  }

  getMobileItems(): NavigationSingleItem[] {
    const mobileItems: NavigationSingleItem[] = [];
    Object.values(this.items).forEach((item) => {
      if (isNavigationGroup(item)) {
        item.subItems.forEach((subItem) => {
          if (subItem.mobile === true) {
            mobileItems.push({
              ...subItem,
              IconComponent: item.IconComponent,
            });
          }
        });
      } else {
        if (item.mobile === true) {
          mobileItems.push(item);
        }
      }
    });
    return mobileItems;
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

export const initializeNavigation = () => {
  const router = useRouter();
  const navigationStore = useNavigationStore();

  useEffect(() => {
    navigationStore.initialize(router.asPath);
  }, []);
};
