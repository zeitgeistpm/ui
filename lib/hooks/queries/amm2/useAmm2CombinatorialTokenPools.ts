import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { CombinatorialToken } from "lib/types/combinatorial";

export const amm2CombinatorialTokenPoolsRootKey =
  "amm2-combinatorial-token-pools";

export function useAmm2CombinatorialTokenPools(
  combiTokens: Set<CombinatorialToken>,
) {
  const [sdk, id] = useSdkv2();
  const combiTokensArray = Array.from(combiTokens);

  const combiPoolsQueries = useQueries({
    queries: combiTokensArray.map((token) => ({
      queryKey: [
        id,
        amm2CombinatorialTokenPoolsRootKey,
        token && token.CombinatorialToken
          ? JSON.stringify(token.CombinatorialToken)
          : null,
      ],
      queryFn: async () => {
        if (!sdk || !isIndexedSdk(sdk) || !token) return;
        const combiTokenHash = JSON.stringify(token.CombinatorialToken);
        const { neoPools } = await sdk.indexer.neoPools({
          where: {
            account: {
              balances_some: {
                assetId_contains: combiTokenHash,
              },
            },
          },
        });
        return neoPools;
      },
      enabled: !!sdk && !!isIndexedSdk(sdk) && !!token,
    })),
  });

  const { combiPoolMap, combiTokensMap } = useMemo(() => {
    const combiPoolMap = new Map<number, any>();
    const combiTokensMap = new Map<string, number>();
    combiTokensArray.forEach((token, idx) => {
      const query = combiPoolsQueries[idx];
      const pools = query?.data;
      if (pools && pools.length > 0) {
        for (const pool of pools) {
          combiTokensMap.set(
            JSON.stringify(token.CombinatorialToken),
            pool.poolId,
          );
          if (!combiPoolMap.has(pool.poolId)) {
            combiPoolMap.set(pool.poolId, pool);
          }
        }
      }
    });
    return { combiPoolMap, combiTokensMap };
  }, [combiTokensArray, combiPoolsQueries]);

  return { combiPoolMap, combiTokensMap };
}
