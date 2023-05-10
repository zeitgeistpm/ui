import type { ApiPromise } from "@polkadot/api";
import type { Extrinsic } from "@polkadot/types/interfaces/extrinsics";
import Decimal from "decimal.js";
import { CurrencyBalance } from "lib/hooks/queries/useCurrencyBalances";

interface Chain {
  name: string;
  isRelayChain: boolean;
  endpoints: string[];
  fetchCurrencies: (
    api: ApiPromise,
    address: string,
  ) => Promise<CurrencyBalance[]>;
  //create deposit extrinsic
  createDepositExtrinsic: (
    api: ApiPromise,
    address: string,
    amount: string,
    parachainId: number,
  ) => Extrinsic;
}
const BATTERY_STATION_CHAINS: Chain[] = [
  {
    name: "Rococo",
    isRelayChain: true,
    endpoints: ["wss://rococo-rpc.polkadot.io"],
    fetchCurrencies: async (api, address) => {
      const account = await api.query.system.account(address);
      return [
        {
          symbol: "ROC",
          balance: new Decimal(account.data.free.toString()),
          chain: "Rococo",
          foreignAssetId: 0,
          sourceChain: "Rococo",
        },
      ];
    },
    createDepositExtrinsic: (api, address, amount, parachainId) => {
      const accountId = api.createType("AccountId32", address).toHex();

      const destination = {
        parents: 1,
        interior: { X1: { Parachain: parachainId } },
      };
      const account = {
        parents: 0,
        interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
      };
      const asset = [
        {
          id: { Concrete: { parents: 0, interior: "Here" } },
          fun: { Fungible: amount },
        },
      ];

      const tx = api.tx.xcmPallet.reserveTransferAssets(
        { V2: destination },
        { V2: account },
        { V2: asset },
        0,
      );

      return tx;
    },
  },
];
const PROD_CHAINS = [];

export const CHAINS: Chain[] =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "NEXT_PUBLIC_VERCEL_ENV"
    ? PROD_CHAINS
    : BATTERY_STATION_CHAINS;
