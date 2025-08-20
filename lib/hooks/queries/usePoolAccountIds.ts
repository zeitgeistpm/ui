import { useQueries } from "@tanstack/react-query";
import { Context, isRpcSdk, Pool } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pool-account-ids";

export const usePoolAccountIds = (pools?: Pool<Context>[]) => {
  const [sdk, id] = useSdkv2();

  const queries = useQueries({
    queries:
      pools?.map((pool) => {
        return {
          enabled: Boolean(sdk && isRpcSdk(sdk) && pool),
          queryKey: [id, rootKey, pool?.poolId],
          keepPreviousData: true,
          queryFn: async () => {
            if (sdk && isRpcSdk(sdk)) {
              return {
                poolId: pool.poolId,
                accountId: (
                  // TODO: This does only work for the old swap pools, not for neo-swap pools
                  await sdk.api.rpc.swaps.poolAccountId(pool.poolId)
                ).toString(),
              };
            }
          },
        };
      }) ?? [],
  });

  return queries.reduce((index, query) => {
    if (!query.data) return index;
    return {
      ...index,
      [query.data.poolId]: query.data.accountId,
    };
  }, {});
};
