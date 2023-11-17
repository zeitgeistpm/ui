import { useQuery } from "@tanstack/react-query";
import { create, windowScheduler } from "@yornaath/batshit";
import { RpcContext, Sdk, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { memoize } from "lodash-es";
import { u128, Option } from "@polkadot/types";

export const caseMarketIdRootKey = "case-market-id";

export const useCaseMarketId = (caseId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && caseId != null && isRpcSdk(sdk);
  const query = useQuery(
    [id, caseMarketIdRootKey, caseId],
    async () => {
      if (!enabled) return;
      return batcher(sdk).fetch(caseId);
    },
    {
      enabled: enabled,
      staleTime: Infinity,
    },
  );

  return query;
};

const batcher = memoize((sdk: Sdk<RpcContext>) => {
  return create({
    fetcher: async (caseIds: number[]) => {
      const data = await sdk.api.query.court.courtIdToMarketId.multi(caseIds);
      const index = caseIds.reduce<Record<number, Option<u128>>>(
        (acc, caseId, index) => ({
          ...acc,
          [caseId]: data[index],
        }),
        {},
      );

      return index;
    },
    scheduler: windowScheduler(10),
    resolver: (data, query) => {
      return data[query].unwrapOr(null)?.toNumber();
    },
  });
});
