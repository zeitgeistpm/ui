import { useQuery } from "@tanstack/react-query";
import { AssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calculateSpotPrice } from "lib/util/amm2";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../../useSdkv2";
import { CombinatorialToken } from "lib/types/combinatorial";

export const amm2MarketSpotPricesRootKey = "amm2-market-spot-prices";

export const useAmm2MarketSpotPrices = (
  poolIds?: number[],
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && !!poolIds && isRpcSdk(sdk);
  const query = useQuery(
    [id, amm2MarketSpotPricesRootKey, poolIds, blockNumber],

    async () => {
      if (!enabled) return;
      const api = await getApiAtBlock(sdk.api, blockNumber);

      const pools = await Promise.all(
        poolIds.map((poolId) => api.query.neoSwaps.pools(poolId)),
      );

      const prices: { [key: string]: Decimal } = {};

      pools.forEach((wrappedPool) => {
        const pool = wrappedPool.unwrapOr(null);
        if (pool) {
          pool.reserves.forEach((reserve, asset) => {
            prices[asset.toString().toLowerCase()] = calculateSpotPrice(
              new Decimal(reserve.toString()),
              new Decimal(pool.liquidityParameter.toString()),
            );
          });
        }
      });

      return prices;
    },
    {
      enabled: enabled,
      staleTime: 10_000,
    },
  );

  return query;
};

export const lookupAssetPrice = (
  assetId: AssetId | CombinatorialToken,
  prices?: { [key: string]: Decimal },
): Decimal | undefined => {
  return prices?.[JSON.stringify(assetId).toLowerCase()];
};
