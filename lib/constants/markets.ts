import { EMarketStatus, MarketStatus } from "lib/types/markets";

export const defaultTags = [
  "Politics",
  "Crypto",
  "Dotsama",
  "Zeitgeist",
  "Technology",
  "Science",
  "News",
  "Sports",
  "E-Sports",
] as const;

export const marketStatuses = Object.keys(EMarketStatus) as MarketStatus[];
