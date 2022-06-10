import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { Asset } from "@zeitgeistpm/types/dist/interfaces";
import Decimal from "decimal.js";
import { NextPage } from "next";
import { FC } from "react";

export enum SupportedParachain {
  KUSAMA = "kusama",
  ROCOCO = "rococo",
  BSR = "bsr",
  CUSTOM = "custom",
}

export const supportedParachainToString = (chain: SupportedParachain) =>
  chain === SupportedParachain.BSR
    ? "BSR Testnet"
    : chain === SupportedParachain.ROCOCO
    ? "Rcococo Testnet"
    : chain === SupportedParachain.KUSAMA
    ? "Kusama Live"
    : "Custom";

export type Theme = "light" | "dark";

export type NotificationType = "Error" | "Info" | "Success";

// Add Layout member to NextPage so it pages can be integrated in layouts for
// code reuse
export type PageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  Layout?: FC | (() => JSX.Element);
};

export type MarketListQuery = {
  pagination: PaginationOptions;
  filter: FilterOptions;
  sorting: SortOptions;
  myMarketsOnly?: boolean;
  tag?: string;
  searchText?: string;
};

export type PoolsListQuery = {
  pagination: PaginationOptions;
};

export type PaginationOptions = {
  page: number;
  pageSize: number;
};

// market id represents creation date, markets with bigger marketId are latest
export enum ESortType {
  Volume = "Volume",
  CreatedAt = "Newest",
  EndDate = "Ends Soon",
}

export type SortType = keyof typeof ESortType;
export type SortOrder = "asc" | "desc";

export type SortOptions = {
  order: SortOrder;
  sortBy: SortType;
};

export type MyMarketsFilterOptions = {
  creator: boolean;
  oracle: boolean;
  hasAssets: boolean;
};

export type MarketsFilterOptions = {
  [K in MarketStatus]: boolean;
} & { HasLiquidityPool: boolean; tags?: string[] };

export type FilterOptions = MyMarketsFilterOptions & MarketsFilterOptions;

export interface SharesBalances {
  yes: Decimal;
  no: Decimal;
}

export interface SelectOption {
  value: number | string;
  label: string;
}

export interface OutcomeSelectOption extends SelectOption {
  value: number;
}

/**
 * Used to generate [[MarketStatus]] and marketStatuses array in
 * 'lib/constants'. Values are irrelevant, but have to be strings so we don't
 * get numbers from Object.keys(..)
 */
export enum EMarketStatus {
  Proposed = "Proposed",
  Active = "Active",
  // Warning: Ended is not an actual MarketStatus in the Substrate code. It's
  // provided here as a convenience.
  Ended = "Ended",
  Reported = "Reported",
  Disputed = "Disputed",
  Resolved = "Resolved",
}

export type MarketStatus = keyof typeof EMarketStatus;

export const isAsset = (val: any): val is Asset => {
  return val.type === "Asset";
};

export const ztgAsset = { ztg: null };
export const ztgAssetJson = JSON.stringify(ztgAsset);

export const isAssetZTG = (val: any): val is { ztg: null } => {
  return JSON.stringify(val) === ztgAssetJson;
};

export type Primitive = null | number | string | boolean;
export type JSONObject =
  | Primitive
  | { [key: string]: JSONObject }
  | JSONObject[];

export interface MarketOutcome {
  metadata: JSONObject;
  asset: AssetId | null;
  weight: number | null;
}

export interface EndpointOption {
  value: string;
  label: string;
  parachain: SupportedParachain;
}

export const isCustomEndpointOption = (
  val: EndpointOption
): val is EndpointOption => {
  return val.parachain == SupportedParachain.CUSTOM;
};

export type TradeType = "buy" | "sell";
