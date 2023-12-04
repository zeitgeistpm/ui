import { ApiPromise, WsProvider } from "@polkadot/api";
import { atom, useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { ChainName, CHAINS } from "lib/constants/chains";
import { useSdkv2 } from "lib/hooks/useSdkv2";

const endpoints = [
  "wss://rpc.polkadot.io",
  "wss://polkadot-rpc.dwellir.com",
  "wss://polkadot.public.curie.radiumblock.co/ws",
  "wss://1rpc.io/dot",
  "wss://rpc-polkadot.luckyfriday.io",
];

const polkadotApiAtom = loadable(
  atom(async () => {
    const wsProvider = new WsProvider(endpoints);
    const api = await ApiPromise.create({ provider: wsProvider });

    return api;
  }),
);

export const usePolkadotApi = () => {
  const [value] = useAtom(polkadotApiAtom);

  if (value.state === "hasData") {
    return { api: value.data, isLoading: false };
  } else {
    return { api: null, isLoading: value.state === "loading" };
  }
};
