import { atom, useAtom } from "jotai";
import { WsProvider, ApiPromise } from "@polkadot/api";
import { CHAINS } from "lib/constants/chains";
import { useState } from "react";

const crossChainApisAtom = atom<ApiPromise[]>([]);

export type UseCrossChainApis = {
  readonly apis: Readonly<ApiPromise>[];
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

    const apis = await Promise.all(apiPromises);

    setApis(apis);
  };

  return {
    initApis,
    apis,
  };
};
