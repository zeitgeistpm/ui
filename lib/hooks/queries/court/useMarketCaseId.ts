import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const marketCaseIdRootKey = "market-case-id";

export const useMarketCaseId = (marketId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && marketId != null && isRpcSdk(sdk);
  const query = useQuery(
    [id, marketCaseIdRootKey, marketId],
    async () => {
      if (!enabled) return null;
      const res = await sdk.api.query.court.marketIdToCourtId(marketId);
      return res.unwrapOr(null)?.toNumber() ?? null;
    },
    {
      enabled: enabled,
      staleTime: Infinity,
    },
  );

  return query;
};
