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
  poolId: number;
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

export const useAmm2Pool = (marketId?: number, poolId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && marketId != null && poolId != null && isRpcSdk(sdk);
  const query = useQuery(
    [id, amm2PoolKey, marketId],
    async () => {
      if (!enabled) return;

      const legacyPoolId = Number(await sdk.api.query.neoSwaps.marketIdToPoolId(marketId));
      console.log(Number(legacyPoolId), "poolIds");
      const res = await sdk.api.query.neoSwaps.pools(legacyPoolId ? legacyPoolId : poolId);
      console.log(res.toHuman(), "res");
      const unwrappedRes = res.unwrap();
      if (unwrappedRes) {
        const reserves: ReserveMap = new Map();
        const assetIds: MarketOutcomeAssetId[] = [];
        unwrappedRes.reserves.forEach((reserve, asset) => {
          const assetId = parseAssetIdString(asset.toString());
          // console.log(IOMarketOutcomeAssetId.is(assetId))
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
          poolId: Number(poolId),
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
