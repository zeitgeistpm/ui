import { ApiPromise, WsProvider } from "@polkadot/api";
import { atom, useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { CHAINS } from "lib/constants/chains";

type Apis = { [key: string]: ApiPromise };

const crossChainApisAtom = loadable(
  atom(async () => {
    const wsProviders = CHAINS.map((chain) => new WsProvider(chain.endpoints));

    const apiPromises = wsProviders.map((provider) =>
      ApiPromise.create({ provider: provider }),
    );

    const apisArr = await Promise.all(apiPromises);

    return apisArr.reduce(
      (apis, api, index) => ({ ...apis, [CHAINS[index].name]: api }),
      {},
    ) as Apis;
  }),
);

export type UseCrossChainApis = {
  apis: { [key: string]: ApiPromise };
  isLoading: boolean;
};

export const useCrossChainApis = () => {
  const [value] = useAtom(crossChainApisAtom);

  if (value.state === "hasData") {
    return { apis: value.data, isLoading: false };
  } else {
    return { apis: null, isLoading: value.state === "loading" };
  }
};
