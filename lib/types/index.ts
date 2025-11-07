import { ScalarRangeType } from "@zeitgeistpm/sdk";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { z } from "zod";

export * from "./virtual-market";

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

export function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null;
}

export function isDefined<T>(t: T | undefined): t is T {
  return t !== undefined;
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

export type MarketOutcome = MarketCategoricalOutcome | MarketScalarOutcome;

export type MarketCategoricalOutcome = { categorical: number };
export type MarketScalarOutcome = { scalar: string };

export const displayOutcome = (
  market: FullMarketFragment,
  outcome:
    | MarketCategoricalOutcome
    | (MarketScalarOutcome & { type: ScalarRangeType }),
) => {
  if (isMarketScalarOutcome(outcome)) {
    return formatScalarOutcome(outcome.scalar, outcome.type);
  } else {
    return market.categories?.[outcome.categorical].name;
  }
};

export const isMarketCategoricalOutcome = (
  val: any,
): val is MarketCategoricalOutcome => {
  return val.categorical != null;
};

export const isMarketScalarOutcome = (val: any): val is MarketScalarOutcome => {
  return val.scalar != null;
};

export const IOCombinatorialToken = z.object({
  CombinatorialToken: z.string()
});

export type CombinatorialToken = z.infer<typeof IOCombinatorialToken>;

export type MarketReport = {
  at: number;
  by: string;
  outcome: MarketCategoricalOutcome | MarketScalarOutcome;
};

export const isValidMarketReport = (report: any): report is MarketReport => {
  return (
    report != null &&
    report.at != null &&
    report.by != null &&
    report.outcome != null &&
    (report.outcome.categorical != null || report.outcome.scalar != null)
  );
};
