import { useQuery } from "@tanstack/react-query";
import { ZTG, isIndexedSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calculateSpotPrice } from "lib/util/amm2";
import { useSdkv2 } from "../useSdkv2";
import { getMarketHeaders } from "lib/gql/market-header";
import { useAllForeignAssetUsdPrices } from "./useAssetUsdPrice";
import { lookUpAssetPrice } from "lib/util/lookup-price";
import { useZtgPrice } from "./useZtgPrice";
import { getLiquiditySharesManagers } from "lib/gql/combo-pools";
import { GraphQLClient } from "graphql-request";

export const accountAmm2PoolsKey = "account-amm2-pools";

export const useAccountAmm2Pool = (address?: string) => {
  const [sdk, id] = useSdkv2();
  const { data: foreignAssetPrices, isLoading: assetPricesLoading } =
    useAllForeignAssetUsdPrices();
  const { data: ztgPrice, isLoading: ztgLoading } = useZtgPrice();

  const enabled =
    !!sdk &&
    !!isIndexedSdk(sdk) &&
    !!address &&
    !!ztgPrice &&
    !!foreignAssetPrices &&
    assetPricesLoading === false &&
    ztgLoading === false;
  const query = useQuery(
    [id, accountAmm2PoolsKey, address],
    async () => {
      if (!enabled) return;

      // Fetch liquidity shares managers directly from GraphQL
      const liquiditySharesManagers = await getLiquiditySharesManagers(
        sdk.indexer.client as unknown as GraphQLClient,
        address,
      );
      // Collect all market IDs (both single and multi-market)
      const allMarketIds = new Set<number>();
      liquiditySharesManagers.forEach((manager) => {
        if (manager.neoPool.isMultiMarket && manager.neoPool.marketIds) {
          // Multi-market pool - add all market IDs
          manager.neoPool.marketIds.forEach((id) => allMarketIds.add(id));
        } else if (manager.neoPool.marketId !== null) {
          // Single market pool
          allMarketIds.add(manager.neoPool.marketId);
        }
      });

      // Fetch market data for all markets
      const markets = await getMarketHeaders(sdk, Array.from(allMarketIds));

      const neoPools = liquiditySharesManagers.map((l) => l.neoPool);

      const valuations = neoPools.map((pool) => {
        const values = pool.account.balances.map((balance) => {
          const price = calculateSpotPrice(
            new Decimal(balance.balance),
            new Decimal(pool.liquidityParameter),
          );

          return price.mul(balance.balance);
        });

        return values.reduce(
          (total, value) => total.plus(value),
          new Decimal(0),
        );
      });

      return neoPools.map((pool, index) => {
        const manager = liquiditySharesManagers[index];
        // Handle multi-market pools
        let question: string | undefined;
        if (pool.isMultiMarket && pool.marketIds && pool.marketIds.length > 1) {
          // Combine questions from all markets
          const poolMarkets = pool.marketIds
            .map((id) => markets.find((m) => m.marketId === id))
            .filter(Boolean);
          question = poolMarkets.map((m) => m?.question).join(" & ");
        } else {
          // Single market pool
          const market = markets.find((m) => m.marketId === pool.marketId);
          question = market?.question;
        }
        const baseAssetUsdPrice = lookUpAssetPrice(
          pool.collateral,
          foreignAssetPrices,
          ztgPrice,
        );

        const totalShares = pool.totalStake;
        const totalValue = valuations[index];

        const percentageOwnership = new Decimal(manager.stake ?? 0).div(
          pool.totalStake,
        );

        const addressValue = totalValue.mul(percentageOwnership).div(ZTG);

        const addressUsdValue = addressValue.mul(baseAssetUsdPrice);
        const addressZtgValue = addressUsdValue.div(ztgPrice);

        return {
          ...pool,
          totalValue,
          addressValue,
          addressUsdValue,
          addressZtgValue,
          question,
          account: manager,
          totalShares,
          baseAsset: pool.collateral,
          marketIds: pool.marketIds || (pool.marketId !== null ? [pool.marketId] : []),
        };
      });
    },
    {
      keepPreviousData: true,
      enabled: enabled,
      staleTime: 30000, // Data fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    },
  );

  return query;
};
