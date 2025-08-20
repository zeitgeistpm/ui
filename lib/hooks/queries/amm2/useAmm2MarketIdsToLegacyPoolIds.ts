import { useQuery } from "@tanstack/react-query";
import { AssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../../useSdkv2";

export const amm2MarketIdsToLegacyPoolIdsRootKey = "amm2-market-ids-to-legacy-pool-ids";

export const useAmm2MarketIdsToLegacyPoolIds = (
  marketIds?: number[],
) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && !!marketIds && isRpcSdk(sdk);
  const query = useQuery(
    [id, amm2MarketIdsToLegacyPoolIdsRootKey, marketIds],

    async () => {
      if (!enabled) return;

      const poolIds = await Promise.all(
        marketIds.map((marketId) => sdk.api.query.neoSwaps.marketIdToPoolId(marketId)),
      );

      return poolIds.filter((opt) => !opt.isNone).map((poolId) => Number(poolId.unwrap()));
    },
    {
      enabled: enabled,
      staleTime: 10_000,
    },
  );

  return query;
};