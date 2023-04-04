import { Icon } from "react-feather";

export type PageName =
  | "index"
  | "create"
  | "markets"
  | "marketDetails"
  | "portfolio"
  | "liquidity"
  | "activity"
  | "court"
  | "avatar";

export interface NavigationSingleItem {
  label: string;
  IconComponent?: Icon;
  href: string;
  pageName: PageName;
  mobile?: boolean;
}

export interface NavigationGroup {
  label: string;
  IconComponent: Icon;
  selected: boolean;
  open: boolean;
  subItems: NavigationSingleItem[];
}

export type NavigationItem = NavigationGroup | NavigationSingleItem;

export const isNavigationGroup = (
  item: NavigationItem,
): item is NavigationGroup => {
  if (item && (item as NavigationGroup).subItems != null) {
    return true;
  }
  return false;
};

export const isNavigationSingleItem = (
  item: NavigationItem,
): item is NavigationSingleItem => {
  if ((item as any).subItems == null) {
    return true;
  }
  return false;
};
