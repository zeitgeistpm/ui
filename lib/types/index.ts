import { ScalarRangeType } from "@zeitgeistpm/sdk-next";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";

export type Primitive = null | number | string | boolean;
export type JSONObject =
  | Primitive
  | { [key: string]: JSONObject }
  | JSONObject[];

export type Environment = "production" | "staging";

export interface EndpointOption {
  value: string;
  label: string;
  environment: Environment;
}

export type TradeType = "buy" | "sell";

export const isScalarRangeType = (
  val: string | null,
): val is ScalarRangeType => {
  if (val === null) {
    return true;
  }
  return ["date", "number"].includes(val);
};
