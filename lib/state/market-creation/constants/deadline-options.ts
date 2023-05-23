import { BlockPeriodPickerOptions } from "components/create/form/inputs/BlockPeriod";
import { DeepReadonly } from "lib/types/deep-readonly";

export const gracePeriodOptions =  [
  { type: "duration", preset: "None", unit: "hours", value: 0 },
  { type: "custom-date"}
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>

export const reportingPeriodOptions = [
  {
    type: "duration",
    preset: "1 Hour",
    unit: "hours",
    value: 1,
  },
  {
    type: "duration",
    preset: "1 Day",
    unit: "days",
    value: 1,
  },
  {
    type: "duration",
    preset: "3 Days",
    unit: "days",
    value: 4,
  },
  { type: "custom-duration" }
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>

export const disputePeriodOptions = [
  {
    type: "duration",
    preset: "1 Day",
    unit: "days",
    value: 1,
  },
  {
    type: "duration",
    preset: "3 Days",
    unit: "days",
    value: 3,
  },
  { type: "custom-duration" }
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>