import {
  FrameSystemAccountInfo,
  PalletBalancesAccountData,
} from "@polkadot/types/lookup";
import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import {
  Context,
  IndexerContext,
  isRpcSdk,
  Pool,
  PoolList,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { usePoolAccountIds } from "./usePoolAccountIds";

export const rootKey = "pool-ztg-balance";

export type PoolZtgBalanceLookup = {
  [poolId: number]: PalletBalancesAccountData;
};

export const usePoolZtgBalance = (pools?: PoolList<IndexerContext>) => {
  const [sdk, id] = useSdkv2();

  const poolAccountIds = usePoolAccountIds(pools);

  const query = useQueries({
    queries:
      pools?.map((pool) => {
        const accountId = poolAccountIds[pool.poolId];
        return {
          queryKey: [id, rootKey, pool.poolId],
          queryFn: async () => {
            if (isRpcSdk(sdk) && pools && accountId) {
              return {
                pool,
                balance: await sdk.context.api.query.system.account(accountId),
              };
            }
            return null;
          },
          enabled: Boolean(sdk) && isRpcSdk(sdk) && Boolean(accountId),
        };
      }) ?? [],
  });

  return query.reduce<PoolZtgBalanceLookup>((index, query) => {
    if (!query.data) return index;
    return {
      ...index,
      [query.data.pool.poolId]: query.data.balance.data,
    };
  }, {});
};
