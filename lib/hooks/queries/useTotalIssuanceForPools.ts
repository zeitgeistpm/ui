import type { u128 } from "@polkadot/types";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import { isRpcSdk, RpcContext, Sdk } from "@zeitgeistpm/sdk-next";
import { memoize } from "lodash-es";
import { useEffect } from "react";
import { useSdkv2 } from "../useSdkv2";

export type UsePoolTotalIssuance = {
  [poolId: number]: UseQueryResult<PoolTotalIssuance, unknown>;
};

export type PoolTotalIssuance = {
  poolId: number;
  totalIssuance: u128;
};

export const poolTotalIssuanceRootQueryKey = "pools-total-issuance";

export const useTotalIssuanceForPools = (poolIds: number[]) => {
  const [sdk, id] = useSdkv2();

  const queries = useQueries({
    queries: poolIds.map((poolId) => ({
      queryKey: [id, poolTotalIssuanceRootQueryKey, poolId],
      queryFn: async () => {
        if (isRpcSdk(sdk)) return batcher(sdk).fetch(poolId);
        return null;
      },
      keepPreviousData: true,
      enabled: Boolean(sdk && isRpcSdk(sdk)),
    })),
  });

  return poolIds.reduce<UsePoolTotalIssuance>((acc, poolId, index) => {
    return {
      ...acc,
      [poolId]: queries[index],
    };
  }, {});
};

const batcher = memoize((sdk: Sdk<RpcContext>) => {
  return batshit.create<PoolTotalIssuance, number>({
    name: poolTotalIssuanceRootQueryKey,
    fetcher: async (ids) => {
      const data = await sdk.api.query.tokens.totalIssuance.multi(
        ids.map((id) => ({ PoolShare: id })),
      );

      return ids.map((id, i) => ({
        poolId: id,
        totalIssuance: data[i],
      }));
    },
    scheduler: batshit.windowScheduler(10),
    resolver: (data, query) => {
      return data.find((d) => d.poolId === query);
    },
  });
});
