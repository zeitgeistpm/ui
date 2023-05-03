import Decimal from "decimal.js";

import type { ApiPromise } from "@polkadot/api";

interface Balance {
  amount: Decimal;
  symbol: string;
}

interface Chain {
  name: string;
  endpoints: string[];
  fetchBalances: (api: ApiPromise, address: string) => Promise<Balance[]>; //todo: figure out return type
}
const BATTERY_STATION_CHAINS: Chain[] = [
  {
    name: "Rococo",
    endpoints: ["wss://rococo-rpc.polkadot.io"],
    fetchBalances: async (api, address) => {
      const account = await api.query.system.account(address);
      return [
        { symbol: "ROC", amount: new Decimal(account.data.free.toString()) },
      ];
    },
  },
];
const PROD_CHAINS = [];

export const CHAINS: Chain[] =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "NEXT_PUBLIC_VERCEL_ENV"
    ? PROD_CHAINS
    : BATTERY_STATION_CHAINS;
