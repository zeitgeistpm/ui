import { EMarketStatus, MarketStatus } from "lib/types/markets";

export const defaultTags = [
  "Politics",
  "Governance",
  "North America",
  "China",
  "India",
  "Crypto",
  "Dotsama",
  "Zeitgeist",
  "Technology",
  "Science",
  "Pandemics",
  "Space",
  "News",
  "Sports",
  "E-sports",
  "Football",
  "MMA",
  "Cricket",
] as const;

export const marketStatuses = Object.keys(EMarketStatus) as MarketStatus[];
