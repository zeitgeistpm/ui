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

export const amm2PoolKey = "amm2-pool";

type ReserveMap = Map<number | "Long" | "Short", Decimal>;

export type Amm2Pool = {
  accountId: string;
  baseAsset: AssetId;
  liquidity: Decimal;
  swapFee: Decimal;
  totalShares: Decimal;
  reserves: ReserveMap;
  assetIds: MarketOutcomeAssetId[];
  accounts: PoolAccount[];
};

type PoolAccount = {
  address: string;
  shares: Decimal;
  fees: Decimal;
};

export const useAmm2Pool = (marketId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && marketId != null && isRpcSdk(sdk);
  const query = useQuery(
    [id, amm2PoolKey, marketId],
    async () => {
      if (!enabled) return;
      const poolId = await sdk.api.query.neoSwaps.marketIdToPoolId(marketId);
      if (!poolId) return;
      const res = await sdk.api.query.neoSwaps.pools(Number(poolId));
      const unwrappedRes = res.unwrapOr(null);

      if (unwrappedRes) {
        const reserves: ReserveMap = new Map();
        const assetIds: MarketOutcomeAssetId[] = [];

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

        const pool: Amm2Pool = {
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
  asset?: string | AssetId,
) => {
  if (!map) return;
  const assetId = parseAssetIdString(asset);
  if (IOMarketOutcomeAssetId.is(assetId)) {
    return map.get(
      IOCategoricalAssetId.is(assetId)
        ? assetId.CategoricalOutcome[1]
        : assetId.ScalarOutcome[1],
    );
  }
};
