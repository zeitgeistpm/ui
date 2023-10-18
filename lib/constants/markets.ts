import { EMarketStatus, MarketStatus } from "lib/types/markets";

const prodTags = [
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

const otherTags = process.env.NEXT_PUBLIC_OTHER_TAGS
  ? JSON.parse(process.env.NEXT_PUBLIC_OTHER_TAGS)
  : [];

export const defaultTags = [...prodTags, ...otherTags] as const;

export type SupportedTag = typeof defaultTags[number];

export const marketStatuses = Object.keys(EMarketStatus) as MarketStatus[];

export const hiddenMarketIds =
  process.env.NEXT_PUBLIC_HIDDEN_MARKET_IDS ?? "[]";
