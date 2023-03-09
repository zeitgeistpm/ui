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

export const NAVIGATION_ITEMS = {
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
