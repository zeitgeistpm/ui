import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { Asset } from "@zeitgeistpm/types/dist/interfaces";
import Decimal from "decimal.js";
import { NextPage } from "next";
import { FC } from "react";

export type Theme = "light" | "dark";

export type NotificationType = "Error" | "Info" | "Success";

// Add Layout member to NextPage so it pages can be integrated in layouts for
// code reuse
export type PageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  Layout?: FC | (() => JSX.Element);
};

export type PoolsListQuery = {
  page: number;
};

export type PaginationOptions = {
  page: number;
  pageSize: number;
};

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

export type Environment = "production" | "staging";

export interface EndpointOption {
  value: string;
  label: string;
  environment: Environment;
}

export type TradeType = "buy" | "sell";
