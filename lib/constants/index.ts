import Decimal from "decimal.js";
import resolveTailwindConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";
import { EndpointOption, Environment } from "../types";

// IMPORTANT: this should be false for all other branches other than the wsx branch.
// export const isCampaignAsset = false;
// export const campaignID = process.env.NEXT_PUBLIC_VERCEL_ENV === "staging" ? 3 : 2;
// export const campaignAssetIdString = `{"foreignAsset":${campaignID}}`;

export const isCampaignAsset: string | false = "wsx";
export const campaignLabel = "WSX";
export const campaignID: number =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "staging" ? 0 : 0;
export const campaignAssetIdString = `{"campaignAsset":${campaignID}}`;

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

export const ZTG_CHAIN_ID = "polkadot:1bf2a2ecb4a868de66ea8610f2ce7c8c";

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
  // {
  //   value: "ws://127.0.0.1:9944",
  //   label: "Custom",
  // },
];

export const graphQlEndpoints: EndpointOption[] = [
  {
    value: "https://processor.bsr.zeitgeist.pm/graphql",
    label: "Battery Park (Testnet)",
    environment: "staging",
  },
  {
    value: "https://zeitgeist-squid-mainnet.stellate.sh/",
    label: "Polkadot (Live)",
    environment: "production",
  },
  // {
  //   value: "http://localhost:4350/graphql",
  //   label: "Custom",
  // },
];

const getEnvironment = (): Environment => {
  const environments = ["production", "staging"];
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (env == null || !["production", "staging"].includes(env)) {
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
  const endpoint = graphQlEndpoints.find((e) => e.environment === environment);
  return endpoint!.value;
};

export const graphQlEndpoint = getGraphQlEndpoint();

const getEndpointOptions = (env: Environment): EndpointOption[] => {
  return endpoints.filter((e) => e.environment === env);
};

export const endpointsProduction = getEndpointOptions("production");
export const endpointsStaging = getEndpointOptions("staging");

export const endpointOptions =
  environment === "production" ? endpointsProduction : endpointsStaging;

export const LAST_MARKET_ID_BEFORE_ASSET_MIGRATION = Number(
  process.env.NEXT_PUBLIC_LAST_MARKET_ID_BEFORE_ASSET_MIGRATION,
);
