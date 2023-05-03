import { atom, useAtom } from "jotai";
import { WsProvider, ApiPromise } from "@polkadot/api";
import { CHAINS } from "lib/constants/chains";
import { useState } from "react";

const crossChainApisAtom = atom<ApiPromise[]>([]);

export type UseCrossChainApis = {
  apis: ApiPromise[];
  initApis: () => void;
};

export const useCrossChainApis = (): UseCrossChainApis => {
  const [apis, setApis] = useAtom(crossChainApisAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const initApis = async () => {
    if (isLoading) return;
    setIsLoading(true);
    console.log("called");

    const wsProviders = CHAINS.map((chain) => new WsProvider(chain.endpoints));

    const apiPromises = wsProviders.map((provider) =>
      ApiPromise.create({ provider: provider }),
    );

    const apis = await Promise.all(apiPromises);
    console.log(apis);

    setApis(apis);
  };

  return {
    initApis,
    apis,
  };
};
