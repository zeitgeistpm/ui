import { useQuery } from "@tanstack/react-query";
import { AssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../../useSdkv2";

export const amm2MarketIdsToLegacyPoolIdsRootKey =
  "amm2-market-ids-to-legacy-pool-ids";

export const useAmm2MarketIdsToLegacyPoolIds = (marketIds?: number[]) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && !!marketIds && isRpcSdk(sdk);
  const query = useQuery(
    [id, amm2MarketIdsToLegacyPoolIdsRootKey, marketIds],

    async () => {
      if (!enabled) return;

      const poolIds = await Promise.all(
        marketIds.map((marketId) =>
          sdk.api.query.neoSwaps.marketIdToPoolId(marketId),
        ),
      );

      // Filter out Option::None, convert to Number, and remove duplicates
      const uniquePoolIds = [
        ...new Set(
          poolIds
            .filter((opt) => !opt.isNone)
            .map((opt) => Number(opt.unwrap())),
        ),
      ];
      return uniquePoolIds;
    },
    {
      enabled: enabled,
      staleTime: 10_000,
    },
  );

  return query;
};
