import Decimal from "decimal.js";
import resolveTailwindConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";
import { EndpointOption, Environment } from "../types";

// IMPORTANT: this should be false for all other branches other than the wsx branch.
export const isWSX = false;

export const wsxID = process.env.NEXT_PUBLIC_VERCEL_ENV === "staging" ? 3 : 2;
export const wsxAssetIdString = `{"foreignAsset":${wsxID}}`;

export const ZTG = 10 ** 10;

export const MIN_USD_DISPLAY_AMOUNT = 0.01;

export const MAX_IN_OUT_RATIO = new Decimal(1).div(3).toString();

export const DEFAULT_SLIPPAGE_PERCENTAGE = 1;

export const BLOCK_TIME_SECONDS = Number(
  process.env["NEXT_PUBLIC_BLOCK_TIME"] ?? 6,
);
export const NUM_BLOCKS_IN_HOUR = 3600 / BLOCK_TIME_SECONDS;
export const NUM_BLOCKS_IN_DAY = NUM_BLOCKS_IN_HOUR * 24;
export const DAY_SECONDS = 86400;
export const ZTG_MIN_LIQUIDITY = 100;

export const TAILWIND = resolveTailwindConfig(tailwindConfig as any);

export const ZTG_BLUE_COLOR = TAILWIND.theme.colors["ztg-blue"];
export const COIN_GECKO_API_KEY = process.env["COIN_GECKO_API_KEY"];

export const SUPPORTED_WALLET_NAMES = [
  "talisman",
  "subwallet-js",
  "polkadot-js",
  "web3auth",
];

export const endpoints: EndpointOption[] = [
  {
    value: "wss://zeitgeist-rpc.dwellir.com",
    label: "Dwellir",
    environment: "production",
  },
  {
    value: "wss://zeitgeist.api.onfinality.io/public-ws",
    label: "OnFinality",
    environment: "production",
  },
  {
    value: "wss://main.rpc.zeitgeist.pm/ws",
    label: "ZeitgeistPM",
    environment: "production",
  },
  {
    value: "wss://bsr.zeitgeist.pm",
    label: "Battery Station",
    environment: "staging",
  },
  {
    value: "ws://zeitgeist-blockchain:9944",
    label: "Local",
    environment: "local",
  },
];

export const graphQlEndpoints: EndpointOption[] = [
  {
    value: "https://zeitgeist-squid-bsr.stellate.sh/",
    label: "Battery Park (Testnet)",
    environment: "staging",
  },
  {
    value: "https://zeitgeist-squid-mainnet.stellate.sh/",
    label: "Polkadot (Live)",
    environment: "production",
  },
  {
    value: "http://subsquid-api:4350/graphql",
    label: "Local",
    environment: "local",
  },
];

const getEnvironment = (): Environment => {
  const environments = ["production", "staging", "local"];
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;

  console.log("env:", env);

  if (env == null || !environments.includes(env)) {
    throw Error(
      `Invalid environment, please set NEXT_PUBLIC_VERCEL_ENV environment variable to one of ${environments.join(
        ",",
      )}`,
    );
  }
  return env as Environment;
};

export const environment = getEnvironment();

const getGraphQlEndpoint = (): string => {
  return (
    process.env.SUBSQUID_ENDPOINT ??
    process.env.NEXT_PUBLIC_SUBSQUID_ENDPOINT ??
    graphQlEndpoints.find((e) => e.environment === environment)!.value
  );
};

export const graphQlEndpoint = getGraphQlEndpoint();

const getEndpointOptions = (env: Environment): string[] => {
  const overrideEndpoint: string | undefined =
    process.env.WS_ENDPOINT ?? process.env.NEXT_PUBLIC_WS_ENDPOINT;

  return overrideEndpoint
    ? [overrideEndpoint]
    : endpoints.filter((e) => e.environment === env).map((e) => e.value);
};

export const endpointsProduction = getEndpointOptions("production");
export const endpointsStaging = getEndpointOptions("staging");

export const endpointOptions = getEndpointOptions(environment);

console.log(endpointOptions);
console.log(graphQlEndpoint);
