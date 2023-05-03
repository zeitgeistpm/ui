import Decimal from "decimal.js";

import type { ApiPromise } from "@polkadot/api";

interface Balance {
  amount: Decimal;
  name: string;
}

interface Chain {
  name: string;
  endpoints: string[];
  fetchBalances: (api: ApiPromise, address: string) => Balance[]; //todo: figure out return type
}
const BATTERY_STATION_CHAINS: Chain[] = [
  {
    name: "Rococo",
    endpoints: ["wss://rococo-rpc.polkadot.io"],
    fetchBalances: (api, address) => {
      return [];
    },
  },
];
const PROD_CHAINS = [];

export const CHAINS: Chain[] =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "NEXT_PUBLIC_VERCEL_ENV"
    ? PROD_CHAINS
    : BATTERY_STATION_CHAINS;
