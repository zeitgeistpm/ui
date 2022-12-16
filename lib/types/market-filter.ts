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
};

export interface MarketStatusFilter extends MarketFilter {
  type: "status";
  value: MarketFilterStatusLabel;
}

export const isMarketStatusFilter = (
  filter: MarketFilter,
): filter is MarketStatusFilter => {
  return filter.type === "status";
};

export interface MarketTagFilter extends MarketFilter {
  type: "tag";
  value: MarketFilterTagLabel;
}

export const isMarketTagFilter = (
  filter: MarketFilter,
): filter is MarketTagFilter => {
  return filter.type === "tag";
};

export interface MarketCurrencyFilter extends MarketFilter {
  type: "currency";
  value: string;
}

export const isMarketCurrencyFilter = (
  filter: MarketFilter,
): filter is MarketCurrencyFilter => {
  return filter.type === "currency";
};

export type MarketsListQuery = {
  filters: {
    [key in MarketFilterType]?: string[];
  };
  ordering: MarketsOrderBy;
  liquidityOnly: boolean;
};
