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
};

type PoolAccount = {
  address: string;
  shares: Decimal;
  fees: Decimal;
};

export const useAmm2Pool = (marketId?: number, poolId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && marketId != null && poolId != null && isRpcSdk(sdk);

  const query = useQuery(
    [id, amm2PoolKey, marketId],
    async () => {
      if (!enabled) return;

      const legacyPoolId = Number(await sdk.api.query.neoSwaps.marketIdToPoolId(marketId));

      const res = await sdk.api.query.neoSwaps.pools(legacyPoolId ? legacyPoolId : poolId);
      
      const unwrappedRes = res.unwrap();

      if (unwrappedRes) {
        const reserves: ReserveMap = new Map();
        const assetIds: (MarketOutcomeAssetId | CombinatorialToken)[] = [];
        unwrappedRes.reserves.forEach((reserve, asset) => {
          const assetId = parseAssetIdString(asset.toString());
          if (IOMarketOutcomeAssetId.is(assetId)) {
            reserves.set(
              IOCategoricalAssetId.is(assetId)
                ? assetId.CategoricalOutcome[1]
                : assetId.ScalarOutcome[1],
              new Decimal(reserve.toString()),
            );
            assetIds.push(assetId);
          } else {
            //Combinatorial markets
            assetIds.push(unwrapCombinatorialToken(asset.toString()))
            reserves.set(getCombinatorialHash(asset.toString()), new Decimal(reserve.toString()))
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
        
        const finalPoolId = legacyPoolId === 0 ? Number(poolId) : legacyPoolId;

        const pool: Amm2Pool = {
          poolId: finalPoolId,
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
        };
        return pool;
      }
    },
    {
      enabled: enabled,
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
