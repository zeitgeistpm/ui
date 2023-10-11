import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";

export const marketPoolIdRootKey = "market-pool-Id";

export const useMarketPoolId = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, marketPoolIdRootKey, marketId],
    async () => {
      if (isRpcSdk(sdk)) {
        const poolId = await sdk.api.query.marketCommons.marketPool(marketId);
        return poolId.isSome ? poolId.unwrap().toNumber() : null;
      }
    },
    {
      enabled: Boolean(sdk && marketId != null && isRpcSdk(sdk)),
    },
  );

  return query;
};
