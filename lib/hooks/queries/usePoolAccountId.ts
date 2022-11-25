import { isString } from "@polkadot/util";
import { useQuery } from "@tanstack/react-query";
import { Context, isRpcSdk, Pool } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pool-account-id";

export const usePoolAccountId = (pool?: Pool<Context>) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, pool?.poolId],
    async () => {
      if (isString(pool.accountId)) {
        return pool.accountId;
      }

      return await pool.accountId();
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
    },
  );

  return query;
};
