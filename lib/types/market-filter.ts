import { filterTypes } from "lib/constants/market-filter";
import { defaultTags } from "lib/constants/markets";
import { MarketStatus } from "./markets";

export enum MarketsOrderBy {
  Newest = "Newest",
  Oldest = "Oldest",
  MostVolume = "Most Volume",
  LeastVolume = "Least Volume",
}

export type MarketOrderByOption = {
  label: MarketsOrderBy;
  value: MarketsOrderBy;
};

export type MarketFilterTagLabel = typeof defaultTags[number];

export type MarketFilterStatusLabel = MarketStatus;

export type MarketFilterType = typeof filterTypes[number];

export type MarketFilter = {
  type: MarketFilterType;
  value: string;
  label: string;
  imageUrl?: string;
};

export interface MarketStatusFilter extends MarketFilter {
  type: "status";
  value: MarketFilterStatusLabel;
}

export interface MarketTagFilter extends MarketFilter {
  type: "tag";
  value: MarketFilterTagLabel;
}

export interface MarketCurrencyFilter extends MarketFilter {
  type: "currency";
  value: string;
}

export type MarketsListFiltersQuery = {
  [key in MarketFilterType]?: string[];
};

export type MarketsListQuery = {
  filters: MarketsListFiltersQuery;
  ordering: MarketsOrderBy;
  liquidityOnly: boolean;
};
