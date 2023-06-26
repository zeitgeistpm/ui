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

export type SupportedTag = typeof defaultTags[number];

export const marketStatuses = Object.keys(EMarketStatus) as MarketStatus[];

export const hiddenMarketIds =
  process.env.NEXT_PUBLIC_HIDDEN_MARKET_IDS ?? "[]";
