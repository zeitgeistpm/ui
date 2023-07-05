import { useQuery } from "@tanstack/react-query";
import type { PalletProxyProxyDefinition } from "@polkadot/types/lookup";
import { useSdkv2 } from "../useSdkv2";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";

export const useAccountProxies = (account?: string) => {
  const [sdk, id] = useSdkv2();

  const enabled = account && isRpcSdk(sdk);

  return useQuery<PalletProxyProxyDefinition[]>(
    [id, account],
    async () => {
      if (!enabled) return null;
      const proxies = await sdk.api.query.proxy.proxies(account);
      return proxies?.[0]?.toArray() ?? [];
    },
    {
      enabled: Boolean(enabled),
    },
  );
};
