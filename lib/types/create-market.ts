export type EndType = "timestamp" | "block";

export type OutcomeType = "multiple" | "range";

export interface MultipleOutcomeEntry {
  name: string;
  ticker: string;
  color: string;
}

export interface RangeOutcomeEntry {
  minimum: number | typeof NaN;
  maximum: number | typeof NaN;
  ticker: string;
}

export type Outcomes = MultipleOutcomeEntry[] | RangeOutcomeEntry;

export const isMultipleOutcomeEntries = (
  value: Outcomes
): value is MultipleOutcomeEntry[] => {
  if (Array.isArray(value)) {
    return true;
  }
  return false;
};

export const isRangeOutcomeEntry = (
  value: Outcomes
): value is RangeOutcomeEntry => {
  if (!Array.isArray(value)) {
    return true;
  }
  return false;
};
