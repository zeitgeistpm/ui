import "@polkadot/api-augment";
import type { ApiPromise } from "@polkadot/api";
import Decimal from "decimal.js";
import { CurrencyBalance } from "lib/hooks/queries/useCurrencyBalances";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ZTG } from ".";
import { calculateFreeBalance } from "lib/util/calc-free-balance";

export type ChainName =
  | "Rococo"
  | "Zeitgeist"
  | "Polkadot"
  | "Moonbeam"
  | "AssetHub";

export const CHAIN_IMAGES: Record<ChainName, string> = {
  Rococo: "/currencies/rococo.png",
  Polkadot: "/currencies/dot.png",
  Zeitgeist: "/currencies/ztg.jpg",
  Moonbeam: "/currencies/moonbeam.png",
  AssetHub: "/currencies/assethub.svg",
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
    assetId?: number,
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
        data.frozen?.toString() ?? "0",
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
        data?.free?.toString(),
        data?.frozen?.toString(),
        data?.reserved?.toString(),
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
  {
    name: "AssetHub",
    isRelayChain: false,
    withdrawFee: "0.0422 USDC",
    depositFee: new Decimal(0.064).mul(ZTG),
    endpoints: [
      "wss://dot-rpc.stakeworld.io/assethub",
      "wss://polkadot-asset-hub-rpc.polkadot.io",
      "wss://rpc-asset-hub-polkadot.luckyfriday.io",
      "wss://sys.ibp.network/statemint",
    ],
    fetchCurrencies: async (api, address) => {
      const balances = await api.query.assets.account(1337, address)
      const assets = await api.query.assets.asset(1337);

      return [
        {
          symbol: "USDC",
          balance: new Decimal(
            balances.unwrapOr(null)?.balance.toString() ?? 0,
          ),
          chain: "AssetHub",
          foreignAssetId: 4,
          sourceChain: "AssetHub",
          existentialDeposit: new Decimal(
            assets.unwrapOr(null)?.minBalance.toString() ?? 0,
          ),
          decimals: 6,
          sourceAssetId: 1337,
        },
      ];
    },
    createDepositExtrinsic: (api, address, amount, parachainId, assetId) => {
      const accountId = api.createType("AccountId32", address).toHex();

      const destination = {
        parents: 1,
        interior: { X1: { Parachain: parachainId } },
      };
      const account = {
        parents: 0,
        interior: { X1: { AccountId32: { id: accountId } } },
      };
      const asset = [
        {
          id: {
            Concrete: {
              parents: 0,
              interior: {
                X2: [{ PalletInstance: 50 }, { GeneralIndex: assetId }], //usdc token ID on asset hub
              },
            },
          },
          fun: {
            Fungible: amount,
          },
        },
      ];

      const tx = api.tx.polkadotXcm.limitedReserveTransferAssets(
        { V3: destination },
        { V3: account },
        { V3: asset },
        0,
        { Unlimited: null },
      );

      return tx;
    },
  },
];

export const CHAINS: Chain[] =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? PROD_CHAINS
    : BATTERY_STATION_CHAINS;