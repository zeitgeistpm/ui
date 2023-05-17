import type { ApiPromise } from "@polkadot/api";
import Decimal from "decimal.js";
import { CurrencyBalance } from "lib/hooks/queries/useCurrencyBalances";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

export type ChainName = "Rococo" | "Zeitgeist" | "Polkadot";

export const CHAIN_IMAGES = {
  Rococo: "/currencies/rococo.png",
  Polkadot: "/currencies/dot.png",
  Zeitgeist: "/currencies/ztg.jpg",
};

interface Chain {
  name: ChainName;
  isRelayChain: boolean;
  endpoints: string[];
  withdrawFee: string;
  fetchCurrencies: (
    api: ApiPromise,
    address: string,
  ) => Promise<CurrencyBalance[]>;
  createDepositExtrinsic: (
    api: ApiPromise,
    address: string,
    amount: string,
    parachainId: number,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult>;
}
const BATTERY_STATION_CHAINS: Chain[] = [
  {
    name: "Rococo",
    isRelayChain: true,
    withdrawFee: "0.01 ROC", // this is made up
    endpoints: ["wss://rococo-rpc.polkadot.io"],
    fetchCurrencies: async (api, address) => {
      const account = await api.query.system.account(address);
      return [
        {
          symbol: "ROC",
          balance: new Decimal(account.data.free.toString()),
          chain: "Rococo",
          foreignAssetId: 1,
          sourceChain: "Rococo",
        },
      ];
    },
    createDepositExtrinsic: (api, address, amount, parachainId) => {
      const accountId = api.createType("AccountId32", address).toHex();

      const destination = {
        parents: 0,
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
const PROD_CHAINS: Chain[] = [
  {
    name: "Polkadot",
    isRelayChain: true,
    withdrawFee: "0.0421 DOT", // informed from testing
    endpoints: [
      "wss://polkadot.api.onfinality.io/public-ws",
      "wss://polkadot-rpc.dwellir.com",
      "wss://rpc.polkadot.io",
    ],
    fetchCurrencies: async (api, address) => {
      const account = await api.query.system.account(address);
      return [
        {
          symbol: "DOT",
          balance: new Decimal(account.data.free.toString()),
          chain: "Polkadot",
          foreignAssetId: 0,
          sourceChain: "Polkadot",
        },
      ];
    },
    createDepositExtrinsic: (api, address, amount, parachainId) => {
      const accountId = api.createType("AccountId32", address).toHex();

      const destination = {
        parents: 0,
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
        { V1: destination },
        { V1: account },
        { V1: asset },
        0,
      );

      return tx;
    },
  },
];

export const CHAINS: Chain[] =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? PROD_CHAINS
    : BATTERY_STATION_CHAINS;
