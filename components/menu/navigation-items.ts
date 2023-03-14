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
  },
  create: {
    label: "Create Market",
    IconComponent: PlusSquare,
    href: "/create",
  },
  portfolio: {
    label: "Portfolio",
    href: "/portfolio",
    IconComponent: Briefcase,
  },
  settings: {
    label: "Settings",
    href: "/settings",
    IconComponent: Settings,
  },
  avatar: {
    label: "Avatar and Badges",
    href: "/avatar",
    IconComponent: User,
  },
  liquidity: {
    label: "Liquidity Pools",
    IconComponent: Droplet,
    href: "/liquidity",
  },
  activity: {
    label: "Activity Feed",
    IconComponent: Box,
    href: "/activity",
  },
  court: {
    label: "Court",
    IconComponent: Users,
    href: "/court",
  },
};
