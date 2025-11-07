import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOCategoricalAssetId,
  IOMarketOutcomeAssetId,
  MarketOutcomeAssetId,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { CombinatorialToken, unwrapCombinatorialToken } from "lib/types/combinatorial";
import { Amm2Pool, amm2PoolKey } from "./useAmm2Pool";

export const useMultipleAmm2Pools = (poolIds: number[]) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && poolIds.length > 0 && isRpcSdk(sdk);

  const query = useQuery(
    [id, amm2PoolKey, "multiple", ...poolIds.sort()],
    async () => {
      if (!enabled) {
        return new Map<number, Amm2Pool>();
      }

      const poolDataMap = new Map<number, Amm2Pool>();

      // Query all pools in parallel
      const poolPromises = poolIds.map(async (poolId) => {
        try {
          const res = await sdk.api.query.neoSwaps.pools(poolId);
          const unwrappedRes = res && res.isSome ? res.unwrap() : null;

          if (unwrappedRes) {
            const reserves = new Map<number | "Long" | "Short" | string, Decimal>();
            const assetIds: (MarketOutcomeAssetId | CombinatorialToken)[] = [];

            // Use assets Vec for correct order, not reserves BTreeMap
            unwrappedRes.assets.forEach((asset) => {
              const assetId = parseAssetIdString(asset.toString());
              if (IOMarketOutcomeAssetId.is(assetId)) {
                const key = IOCategoricalAssetId.is(assetId)
                  ? assetId.CategoricalOutcome[1]
                  : assetId.ScalarOutcome[1];
                assetIds.push(assetId);
                // Get reserve amount for this asset
                const reserveAmount = unwrappedRes.reserves.get(asset);
                if (reserveAmount) {
                  reserves.set(key, new Decimal(reserveAmount.toString()));
                }
              } else {
                // Combinatorial markets
                const unwrappedToken = unwrapCombinatorialToken(asset.toString());
                assetIds.push(unwrappedToken);
                // Get reserve amount for this asset
                const reserveAmount = unwrappedRes.reserves.get(asset);
                if (reserveAmount) {
                  reserves.set(unwrappedToken.CombinatorialToken, new Decimal(reserveAmount.toString()));
                }
              }
            });

            const poolAccounts = unwrappedRes.liquiditySharesManager.nodes.map((node) => ({
              address: node.account.toString(),
              shares: new Decimal(node.stake.toString()),
              fees: new Decimal(node.fees.toString()),
            }));

            // Get pool creation timestamp from block hash
            let createdAt: Date | undefined;
            if (unwrappedRes.createdAtHash) {
              try {
                const blockHash = unwrappedRes.createdAtHash.toString();
                const signedBlock = await sdk.api.rpc.chain.getBlock(blockHash);
                const blockTimestamp = await sdk.api.query.timestamp.now.at(blockHash);
                createdAt = new Date(blockTimestamp.toNumber());
              } catch (error) {
                console.error('Failed to get pool creation timestamp:', error);
              }
            }

            const pool: Amm2Pool = {
              poolId: poolId,
              accountId: unwrappedRes.accountId.toString(),
              baseAsset: parseAssetIdString(unwrappedRes.collateral.toString())!,
              liquidity: new Decimal(unwrappedRes.liquidityParameter.toString()),
              swapFee: new Decimal(unwrappedRes.swapFee.toString()),
              accounts: poolAccounts,
              reserves: reserves as any,
              assetIds,
              totalShares: poolAccounts.reduce<Decimal>(
                (total, account) => total.plus(account.shares),
                new Decimal(0),
              ),
              poolType: JSON.parse(unwrappedRes.poolType.toString()),
              createdAt,
            };

            return { poolId, pool };
          }
        } catch (error) {
          console.error(`Failed to fetch pool ${poolId}:`, error);
        }
        return null;
      });

      const results = await Promise.all(poolPromises);

      results.forEach((result) => {
        if (result) {
          poolDataMap.set(result.poolId, result.pool);
        }
      });

      return poolDataMap;
    },
    {
      enabled: enabled,
      staleTime: 60 * 1000, // Data is fresh for 1 minute
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  );

  return query;
};