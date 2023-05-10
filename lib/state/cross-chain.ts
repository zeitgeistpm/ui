import { atom, useAtom } from "jotai";
import { WsProvider, ApiPromise } from "@polkadot/api";
import { ChainName, CHAINS } from "lib/constants/chains";
import { useState } from "react";

type Apis = { [key: string]: ApiPromise };

const crossChainApisAtom = atom<Apis>({});

export type UseCrossChainApis = {
  // apis: ApiPromise[];
  apis: { [key: string]: ApiPromise };
  initApis: () => void;
};

export const useCrossChainApis = (): UseCrossChainApis => {
  const [apis, setApis] = useAtom(crossChainApisAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const initApis = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const wsProviders = CHAINS.map((chain) => new WsProvider(chain.endpoints));

    const apiPromises = wsProviders.map((provider) =>
      ApiPromise.create({ provider: provider }),
    );

    const apisArr = await Promise.all(apiPromises);

    const apis = apisArr.reduce(
      (apis, api, index) => ({ ...apis, [CHAINS[index].name]: api }),
      {},
    );

    setApis(apis);
  };

  return {
    initApis,
    apis,
  };
};
