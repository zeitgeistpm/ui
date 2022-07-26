import resolveTailwindConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config";
import {
  MarketStatus,
  EMarketStatus,
  ESortType,
  EndpointOption,
  MarketsFilterOptions,
  SupportedParachain,
} from "./types";

export const ZTG = 10 ** 10;

export const DEFAULT_SLIPPAGE_PERCENTAGE =
  Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_PERCENTAGE) || 1;

export const REPORT_ALLOWED_DURATION_MS = 24 * 3600 * 1000; // 24 hours

export const BLOCK_TIME_SECONDS = Number(
  process.env["NEXT_PUBLIC_BLOCK_TIME"] ?? 6
);
export const NUM_BLOCKS_IN_HOUR = 3600 / BLOCK_TIME_SECONDS;
export const NUM_BLOCKS_IN_DAY = NUM_BLOCKS_IN_HOUR * 24;
export const DAY_SECONDS = 86400;

export const ZTG_BLUE_COLOR =
  resolveTailwindConfig(tailwindConfig).theme.colors["ztg-blue"];

export const marketStatuses = Object.keys(EMarketStatus) as MarketStatus[];

export const sortOptions = Object.entries(ESortType).map((v) => {
  return {
    sortBy: v[0],
    label: v[1],
  };
});

export const endpoints: EndpointOption[] = [
  {
    value: "wss://rpc-0.zeitgeist.pm/",
    label: "ZeitgeistPM",
    parachain: SupportedParachain.KUSAMA,
  },
  {
    value: "wss://zeitgeist-rpc.dwellir.com/",
    label: "Dwellir",
    parachain: SupportedParachain.KUSAMA,
  },
  {
    value: "wss://zeitgeist.api.onfinality.io/public-ws",
    label: "OnFinality",
    parachain: SupportedParachain.KUSAMA,
  },
  {
    value: "wss://bsr.zeitgeist.pm",
    label: "Battery Station",
    parachain: SupportedParachain.BSR,
  },
  {
    value: "ws://127.0.0.1:9944",
    label: "Custom",
    parachain: SupportedParachain.CUSTOM,
  },
];

export const gqlEndpoints: EndpointOption[] = [
  {
    value: "https://processor.bsr.zeitgeist.pm/graphql",
    label: "Battery Park (Testnet)",
    parachain: SupportedParachain.BSR,
  },
  {
    value: "https://processor.rpc-0.zeitgeist.pm/graphql ",
    label: "Kusama (Live)",
    parachain: SupportedParachain.KUSAMA,
  },
  {
    value: "http://localhost:4350/graphql",
    label: "Custom",
    parachain: SupportedParachain.CUSTOM,
  },
];

export const allMarketsFiltersOff: MarketsFilterOptions = {
  Proposed: false,
  Active: false,
  Closed: false,
  Reported: false,
  Disputed: false,
  Resolved: false,
  HasLiquidityPool: false,
};
