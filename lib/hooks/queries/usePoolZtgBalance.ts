import { FrameSystemAccountInfo } from "@polkadot/types/lookup";
import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import {
  Context,
  IndexerContext,
  isRpcSdk,
  Pool,
  PoolList,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pool-ztg-balance";

export type PoolZtgBalancePair = {
  pool: Pool<Context>;
  balance: FrameSystemAccountInfo;
};

export const usePoolZtgBalance = (pools?: PoolList<IndexerContext>) => {
  const [sdk, id] = useSdkv2();

  const query = useQueries({
    queries:
      pools?.map<UseQueryOptions<null | PoolZtgBalancePair>>((pool) => {
        return {
          queryKey: [id, rootKey, pool.poolId],
          queryFn: async () => {
            if (isRpcSdk(sdk) && pools) {
              return {
                pool,
                balance: await sdk.context.api.query.system.account(
                  pool.accountId,
                ),
              };
            }
            return null;
          },
          enabled: Boolean(sdk) && isRpcSdk(sdk),
        };
      }) ?? [],
  });

  return query.flatMap((q) => q.data);
};
