import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ComboPoolData, ComboPoolStatsData, MarketBasicData } from "../gql/combo-pools";

export type MarketStats = {
  liquidity: string;
  participants: number;
  volume: string;
};

// Regular market item for listings
export type MarketListItem = {
  type: "market";
  data: FullMarketFragment;
  stats: MarketStats;
  marketId: number;
  slug: string;
  question: string;
  categories: Array<{ name: string; color: string }>;
  status: string;
  baseAsset: string;
  link: string;
};

// Combo pool item for listings  
export type ComboPoolListItem = {
  type: "combo";
  data: ComboPoolData;
  stats: MarketStats;
  associatedMarkets: MarketBasicData[];
  marketId: number; // Primary market ID for routing
  slug: string;
  question: string; // Combined question
  categories: Array<{ name: string; color: string }>; // Combined categories
  status: string;
  baseAsset: string;
  link: string;
};

// Union type for market listings
export type MarketOrComboItem = MarketListItem | ComboPoolListItem;

// Type guard functions
export const isMarketItem = (item: MarketOrComboItem): item is MarketListItem => {
  return item.type === "market";
};

export const isComboPoolItem = (item: MarketOrComboItem): item is ComboPoolListItem => {
  return item.type === "combo";
};