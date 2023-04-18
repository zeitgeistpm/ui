import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { Asset } from "@zeitgeistpm/types/dist/interfaces";

export type PoolsListQuery = {
  page: number;
};

export interface SelectOption {
  value: number | string;
  label: string;
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
