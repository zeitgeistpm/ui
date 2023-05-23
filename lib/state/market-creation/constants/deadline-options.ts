import { NUM_BLOCKS_IN_DAY, NUM_BLOCKS_IN_HOUR } from "lib/constants";
import { DeepReadonly } from "lib/types/deep-readonly";
import { PeriodOption } from "../types/form";
import { BlockPeriodPickerOptions } from "components/create/form/inputs/BlockPeriod";

export const gracePeriodOptions =  [
  { type: "preset", label: "None", blocks: 0 },
  { type: "custom-date"}
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>

export const reportingPeriodOptions = [
  {
    type: "preset",
    label: "1 Hour",
    blocks: NUM_BLOCKS_IN_HOUR,
  },
  {
    type: "preset",
    label: "1 Day",
    blocks: NUM_BLOCKS_IN_DAY * 1,
  },
  {
    type: "preset",
    label: "3 Days",
    blocks: NUM_BLOCKS_IN_DAY * 3,
  },
  { type: "custom-duration" }
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>

export const disputePeriodOptions = [
  {
    type: "preset",
    label: "1 Day",
    blocks: NUM_BLOCKS_IN_DAY * 1,
  },
  {
    type: "preset",
    label: "3 Days",
    blocks: NUM_BLOCKS_IN_DAY * 3,
  },
  { type: "custom-duration" }
] as const satisfies DeepReadonly<BlockPeriodPickerOptions>