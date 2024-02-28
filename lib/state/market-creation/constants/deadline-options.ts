import { BlockPeriodPickerOptions } from "components/create/editor/inputs/BlockPeriod";
import { DeepReadonly } from "lib/types/deep-readonly";

/**
 * Options for the block period pickers.
 * Used in the time period step of the market creation process.
 */

export const gracePeriodOptions = [
  { type: "duration", preset: "None", unit: "hours", value: 0 },
  { type: "custom-date" },
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>;

export const reportingPeriodOptions = [
  {
    type: "duration",
    preset: "1 Day",
    unit: "days",
    value: 1,
  },
  {
    type: "duration",
    preset: "4 Days",
    unit: "days",
    value: 4,
  },
  { type: "custom-duration" },
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>;

export const disputePeriodOptions = [
  {
    type: "duration",
    preset: "1 Day",
    unit: "days",
    value: 1,
  },
  {
    type: "duration",
    preset: "2 Days",
    unit: "days",
    value: 2,
  },
  { type: "custom-duration" },
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>;
