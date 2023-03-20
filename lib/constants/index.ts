import { MarketDeadlines } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import resolveTailwindConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";
import { EndpointOption, SupportedParachain } from "../types";

export const ZTG = 10 ** 10;

export const MAX_IN_OUT_RATIO = new Decimal(1).div(3).toString();

export const DEFAULT_SLIPPAGE_PERCENTAGE = 1;

export const REPORT_ALLOWED_DURATION_MS = 24 * 3600 * 1000; // 24 hours

export const BLOCK_TIME_SECONDS = Number(
  process.env["NEXT_PUBLIC_BLOCK_TIME"] ?? 6,
);
export const NUM_BLOCKS_IN_HOUR = 3600 / BLOCK_TIME_SECONDS;
export const NUM_BLOCKS_IN_DAY = NUM_BLOCKS_IN_HOUR * 24;
export const DAY_SECONDS = 86400;

export const ZTG_BLUE_COLOR = resolveTailwindConfig(tailwindConfig as any).theme
  .colors["ztg-blue"];

export const SUPPORTED_WALLET_NAMES = [
  "talisman",
  "subwallet-js",
  "polkadot-js",
];

export const DEFAULT_DEADLINES: MarketDeadlines = {
  gracePeriod: "0",
  oracleDuration: "28800",
  disputeDuration: "28800",
};

export const endpoints: EndpointOption[] = [
  // {
  //   value: "wss://rpc-0.zeitgeist.pm/",
  //   label: "ZeitgeistPM",
  //   parachain: SupportedParachain.KUSAMA,
  // },
  {
    value: "wss://zeitgeist-rpc.dwellir.com/",
    label: "Dwellir",
    parachain: SupportedParachain.POLKADOT,
  },
  {
    value: "wss://zeitgeist.api.onfinality.io/public-ws",
    label: "OnFinality",
    parachain: SupportedParachain.POLKADOT,
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
    value: "https://processor.rpc-0.zeitgeist.pm/graphql",
    label: "Polkadot (Live)",
    parachain: SupportedParachain.POLKADOT,
  },
  {
    value: "http://localhost:4350/graphql",
    label: "Custom",
    parachain: SupportedParachain.CUSTOM,
  },
];
