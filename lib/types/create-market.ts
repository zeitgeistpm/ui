export type EndType = "timestamp" | "block";

export type OutcomeType = "yesno" | "multiple" | "range";

export interface MultipleOutcomeEntry {
  name: string;
  ticker: string;
  color: string;
}

export interface RangeOutcomeEntry {
  minimum: string;
  maximum: string;
  ticker: string;
  type: RangeType;
}

export type RangeType = "number" | "date";

export type YesNoOutcome = [
  { name: "Yes"; ticker: "YES"; color: "#0E992D" },
  { name: "No"; ticker: "NO"; color: "#00A3FF" },
];

export type Outcomes =
  | YesNoOutcome
  | MultipleOutcomeEntry[]
  | RangeOutcomeEntry;

export const isMultipleOutcomeEntries = (
  value: Outcomes,
): value is MultipleOutcomeEntry[] => {
  if (Array.isArray(value)) {
    return true;
  }
  return false;
};

export const isRangeOutcomeEntry = (
  value: Outcomes,
): value is RangeOutcomeEntry => {
  if (!Array.isArray(value)) {
    return true;
  }
  return false;
};

export const isDateRangeOutcomeEntry = (
  value: Outcomes,
): value is RangeOutcomeEntry & { type: "date" } => {
  if (value && !Array.isArray(value) && value.type === "date") {
    return true;
  }
  return false;
};

export type MarketImageCid = string;
export type MarketImageBase64Encoded = string;

export type MarketImageString = MarketImageCid | MarketImageBase64Encoded;

export const isMarketImageBase64Encoded = (
  image: string,
): image is MarketImageBase64Encoded => {
  return image.startsWith("data:image");
};
