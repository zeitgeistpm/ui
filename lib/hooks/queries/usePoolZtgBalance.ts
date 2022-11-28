import { useQuery } from "@tanstack/react-query";
import { IndexerContext, isRpcSdk, PoolList } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pool-ztg-balance";

export const usePoolZtgBalance = (pools?: PoolList<IndexerContext>) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, pools?.map((p) => p.poolId)],
    async () => {
      if (isRpcSdk(sdk) && pools) {
        return (
          await sdk.context.api.query.system.account.multi(
            pools.map((p) => p.accountId),
          )
        ).map((balance, index) => ({
          pool: pools[index],
          balance,
        }));
      }
      return [];
    },
    {
      initialData: [],
      enabled: Boolean(sdk && isRpcSdk(sdk) && pools && pools.length),
    },
  );

  return query;
};
