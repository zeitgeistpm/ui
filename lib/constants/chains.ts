import Decimal from "decimal.js";

import type { ApiPromise } from "@polkadot/api";
import { CurrencyBalance } from "lib/hooks/queries/useCurrencyBalances";

interface Chain {
  name: string;
  endpoints: string[];
  fetchBalances: (
    api: ApiPromise,
    address: string,
  ) => Promise<CurrencyBalance[]>;
}
const BATTERY_STATION_CHAINS: Chain[] = [
  {
    name: "Rococo",
    endpoints: ["wss://rococo-rpc.polkadot.io"],
    fetchBalances: async (api, address) => {
      const account = await api.query.system.account(address);
      return [
        {
          symbol: "ROC",
          balance: new Decimal(account.data.free.toString()),
          chain: "Rococo",
        },
      ];
    },
  },
];
const PROD_CHAINS = [];

export const CHAINS: Chain[] =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "NEXT_PUBLIC_VERCEL_ENV"
    ? PROD_CHAINS
    : BATTERY_STATION_CHAINS;
