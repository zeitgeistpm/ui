import type { ApiPromise } from "@polkadot/api";
import Decimal from "decimal.js";
import { CurrencyBalance } from "lib/hooks/queries/useCurrencyBalances";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ZTG } from ".";
import { calculateFreeBalance } from "lib/util/calc-free-balance";

export type ChainName = "Rococo" | "Zeitgeist" | "Polkadot" | "Moonbeam";

export const CHAIN_IMAGES = {
  Rococo: "/currencies/rococo.png",
  Polkadot: "/currencies/dot.png",
  Zeitgeist: "/currencies/ztg.jpg",
  Moonbeam: "/currencies/moonbeam.png",
};

interface Chain {
  name: ChainName;
  isRelayChain: boolean;
  endpoints: string[];
  withdrawFee: string;
  depositFee: Decimal;
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
    depositFee: new Decimal(0.01).mul(ZTG), // this is made up
    endpoints: ["wss://rococo-rpc.polkadot.io"],
    fetchCurrencies: async (api, address) => {
      const { data } = await api.query.system.account(address);
      const free = calculateFreeBalance(
        data.free.toString(),
        //@ts-ignore
        data.miscFrozen?.toString() ?? data.frozen?.toString(),
        data.feeFrozen?.toString() ?? "0",
      );

      return [
        {
          symbol: "ROC",
          balance: free,
          chain: "Rococo",
          foreignAssetId: 1,
          sourceChain: "Rococo",
          existentialDeposit: new Decimal(
            api.consts.balances.existentialDeposit.toString(),
          ),
          decimals: 12,
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
        interior: { X1: { AccountId32: { id: accountId } } },
      };
      const asset = [
        {
          id: { Concrete: { parents: 0, interior: "Here" } },
          fun: { Fungible: amount },
        },
      ];

      const tx = api.tx.xcmPallet.reserveTransferAssets(
        { V3: destination },
        { V3: account },
        { V3: asset },
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
    withdrawFee: "0.0422 DOT", // informed from testing
    depositFee: new Decimal(0.064).mul(ZTG), // informed from testing
    endpoints: [
      "wss://rpc.polkadot.io",
      "wss://polkadot-rpc.dwellir.com",
      "wss://polkadot.public.curie.radiumblock.co/ws",
      "wss://1rpc.io/dot",
    ],
    fetchCurrencies: async (api, address) => {
      const { data } = await api.query.system.account(address);
      const free = calculateFreeBalance(
        data.free.toString(),
        //@ts-ignore once polkadot is upgraded to match rococo the latter half of this statement can be removed
        data.miscFrozen?.toString() ?? data.frozen?.toString(),
        data.feeFrozen?.toString() ?? "0",
      );

      return [
        {
          symbol: "DOT",
          balance: free,
          chain: "Polkadot",
          foreignAssetId: 0,
          sourceChain: "Polkadot",
          existentialDeposit: new Decimal(
            api.consts.balances.existentialDeposit.toString(),
          ),
          decimals: 10,
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
        interior: { X1: { AccountId32: { id: accountId } } },
      };
      const asset = [
        {
          id: { Concrete: { parents: 0, interior: "Here" } },
          fun: { Fungible: amount },
        },
      ];

      const tx = api.tx.xcmPallet.reserveTransferAssets(
        { V3: destination },
        { V3: account },
        { V3: asset },
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
