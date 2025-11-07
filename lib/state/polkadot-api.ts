import { ApiPromise, WsProvider } from "@polkadot/api";
import { atom, useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { environment } from "lib/constants";

const endpoints =
  environment !== "production"
    ? [
        "wss://rpc.polkadot.io",
        "wss://polkadot-rpc.dwellir.com",
        "wss://polkadot.public.curie.radiumblock.co/ws",
        "wss://1rpc.io/dot",
        "wss://rpc-polkadot.luckyfriday.io",
      ]
    : ["wss://rococo-rpc.polkadot.io"];

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
