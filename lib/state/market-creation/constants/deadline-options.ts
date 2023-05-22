import { NUM_BLOCKS_IN_DAY, NUM_BLOCKS_IN_HOUR } from "lib/constants";
import { DeepReadonly } from "lib/types/deep-readonly";
import { PeriodOption } from "../types/form";

export const gracePeriodOptions = [
  { type: "blocks", label: "None", value: 0 },
  {
    type: "blocks",
    label: "1 Day",
    value: NUM_BLOCKS_IN_DAY * 1,
  },
  {
    type: "blocks",
    label: "3 Days",
    value: NUM_BLOCKS_IN_DAY * 3,
  },
] as const satisfies DeepReadonly<PeriodOption[]>

export const reportingPeriodOptions = [
  {
    type: "blocks",
    label: "1 Hour",
    value: NUM_BLOCKS_IN_HOUR,
  },
  {
    type: "blocks",
    label: "1 Day",
    value: NUM_BLOCKS_IN_DAY * 1,
  },
  {
    type: "blocks",
    label: "3 Days",
    value: NUM_BLOCKS_IN_DAY * 3,
  },
] as const satisfies DeepReadonly<PeriodOption[]>

export const disputePeriodOptions = [
  {
    type: "blocks",
    label: "1 Day",
    value: NUM_BLOCKS_IN_DAY * 1,
  },
  {
    type: "blocks",
    label: "3 Days",
    value: NUM_BLOCKS_IN_DAY * 3,
  },
] as const satisfies DeepReadonly<PeriodOption[]>