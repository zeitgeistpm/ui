import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const caseMarketIdRootKey = "case-market-id";

export const useCaseMarketId = (caseId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && caseId != null && isRpcSdk(sdk);
  const query = useQuery(
    [id, caseMarketIdRootKey, caseId],
    async () => {
      if (!enabled) return;
      const res = await sdk.api.query.court.courtIdToMarketId(caseId);

      return res.unwrapOr(null)?.toNumber();
    },
    {
      enabled: enabled,
      staleTime: Infinity,
    },
  );

  return query;
};
