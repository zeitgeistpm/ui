import {
  BarChart2,
  Box,
  Briefcase,
  Droplet,
  PlusSquare,
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
