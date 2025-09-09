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
import { CombinatorialToken, CombinatorialTokenString, unwrapCombinatorialToken, getCombinatorialHash, isCombinatorialToken } from "lib/types/combinatorial";
import { sortAssetsByMarketOrder } from "lib/util/sort-assets-by-market";
export const amm2PoolKey = "amm2-pool";

type ReserveMap = Map<number | "Long" | "Short" | CombinatorialTokenString , Decimal>;

export type Amm2Pool = {
  poolId: number;
  accountId: string;
  baseAsset: AssetId;
  liquidity: Decimal;
  swapFee: Decimal;
  totalShares: Decimal;
  reserves: ReserveMap;
  assetIds: (MarketOutcomeAssetId | CombinatorialToken)[];
  accounts: PoolAccount[];
  poolType: any; //TODO: get this from the poolType
  createdAt?: Date; // Pool creation timestamp
};

type PoolAccount = {
  address: string;
  shares: Decimal;
  fees: Decimal;
};

export const useAmm2Pool = (marketId: number, poolId: number | null, activeMarket?: any) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && marketId != null && poolId != undefined && isRpcSdk(sdk);
  //TODO: improve this logic in the futre. right now we know legacy markets have the same poolId as marketId
  const legacy = marketId === poolId
  const query = useQuery(
    [id, amm2PoolKey, marketId],
    async () => {
      if (!enabled) return;

      const poolIdToUse = legacy ? Number(await sdk.api.query.neoSwaps.marketIdToPoolId(marketId)) : poolId!;
      const res = await sdk.api.query.neoSwaps.pools(poolIdToUse);
      // Check if the result is Some before unwrapping
      const unwrappedRes = res && res.isSome ? res.unwrap() : null;

      if (unwrappedRes) {
        const reserves: ReserveMap = new Map();
        const assetIds: (MarketOutcomeAssetId | CombinatorialToken)[] = [];
        // Temporary storage for reserves
        const tempReserves: Map<string | number | "Long" | "Short", Decimal> = new Map();
        
        unwrappedRes.reserves.forEach((reserve, asset) => {
          const assetId = parseAssetIdString(asset.toString());
          if (IOMarketOutcomeAssetId.is(assetId)) {
            const key = IOCategoricalAssetId.is(assetId)
              ? assetId.CategoricalOutcome[1]
              : assetId.ScalarOutcome[1];
            tempReserves.set(key, new Decimal(reserve.toString()));
            assetIds.push(assetId);
          } else {
            //Combinatorial markets
            const unwrappedToken = unwrapCombinatorialToken(asset.toString());
            assetIds.push(unwrappedToken);
            tempReserves.set(unwrappedToken.CombinatorialToken, new Decimal(reserve.toString()));
          }
        });

        // Sort assets to match market.outcomeAssets order
        const sortedAssetIds = sortAssetsByMarketOrder(assetIds, activeMarket?.outcomeAssets);
        // Replace assetIds with sorted version if different
        if (sortedAssetIds !== assetIds) {
          assetIds.length = 0;
          assetIds.push(...sortedAssetIds);
        }

        // Build reserves Map in the sorted order
        assetIds.forEach(asset => {
          const key = IOMarketOutcomeAssetId.is(asset)
            ? (IOCategoricalAssetId.is(asset) 
                ? asset.CategoricalOutcome[1] 
                : asset.ScalarOutcome[1])
            : asset.CombinatorialToken;
          const value = tempReserves.get(key);
          if (value) {
            reserves.set(key, value);
          }
        });

        const poolAccounts: PoolAccount[] =
          unwrappedRes.liquiditySharesManager.nodes.map((node) => {
            return {
              address: node.account.toString(),
              shares: new Decimal(node.stake.toString()),
              fees: new Decimal(node.fees.toString()),
            };
          });
        // Get pool creation timestamp from block hash
        let createdAt: Date | undefined;
        if (unwrappedRes.createdAtHash) {
          try {
            const blockHash = unwrappedRes.createdAtHash.toString();
            const signedBlock = await sdk.api.rpc.chain.getBlock(blockHash);
            const blockNumber = signedBlock.block.header.number.toNumber();
            const blockTimestamp = await sdk.api.query.timestamp.now.at(blockHash);
            createdAt = new Date(blockTimestamp.toNumber());
          } catch (error) {
            console.error('Failed to get pool creation timestamp:', error);
          }
        }
        
        const pool: Amm2Pool = {
          poolId: poolIdToUse,
          accountId: unwrappedRes.accountId.toString(),
          baseAsset: parseAssetIdString(unwrappedRes.collateral.toString())!,
          liquidity: new Decimal(unwrappedRes.liquidityParameter.toString()),
          swapFee: new Decimal(unwrappedRes.swapFee.toString()),
          accounts: poolAccounts,
          reserves,
          assetIds,
          totalShares: poolAccounts.reduce<Decimal>(
            (total, account) => total.plus(account.shares),
            new Decimal(0),
          ),
          poolType: JSON.parse(unwrappedRes.poolType.toString()),
          createdAt,
        };
        return pool;
      }
      
      // Return null if pool doesn't exist
      return null;
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

export const lookupAssetReserve = (
  map?: ReserveMap,
  asset?: string | AssetId | CombinatorialToken,
) => {
  if (!map) return;
  if (isCombinatorialToken(asset)) {
    return map.get(asset.CombinatorialToken);
  }
  const assetId = parseAssetIdString(asset);
  if (IOMarketOutcomeAssetId.is(assetId)) {
    return map.get(
      IOCategoricalAssetId.is(assetId)
        ? assetId.CategoricalOutcome[1]
        : assetId.ScalarOutcome[1],
    );
  }
};
