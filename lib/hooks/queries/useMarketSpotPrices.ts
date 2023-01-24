import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
import { calcScalarResolvedPrices } from "lib/util/calc-scalar-winnings";
import { useSdkv2 } from "../useSdkv2";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket } from "./useMarket";

export const assetPricesKey = Symbol();

export const useMarketSpotPrices = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const { data: market } = useMarket(marketId);
  const pool = market?.pool;
  const { data: balances } = useAccountPoolAssetBalances(pool?.accountId, pool);

  const query = useQuery(
    [id, assetPricesKey, pool, balances],
    async () => {
      if (isRpcSdk(sdk)) {
        const spotPrices = new Map<number, Decimal>();
        const outcomeWeights = pool.weights.filter(
          (weight) =>
            weight.assetId.toLocaleLowerCase() !==
            pool.baseAsset.toLocaleLowerCase(),
        );

        if (market.status !== "Resolved") {
          const basePoolBalance = await sdk.context.api.query.system.account(
            pool.accountId,
          );

          //base weight is equal to the sum of all other assets
          const baseWeight = new Decimal(pool.totalWeight).div(2);

          outcomeWeights.forEach((weight, index) => {
            const spotPrice = calcSpotPrice(
              basePoolBalance.data.free.toString(),
              baseWeight,
              balances[index].free.toString(),
              weight.len,
              0,
            );

            spotPrices.set(index, spotPrice);
          });
          return spotPrices;
        } else {
          if (market.marketType.scalar) {
            const { shortTokenValue, longTokenValue } =
              calcScalarResolvedPrices(
                new Decimal(market.marketType.scalar[0]),
                new Decimal(market.marketType.scalar[1]),
                new Decimal(market.resolvedOutcome),
              );

            outcomeWeights.forEach((weight, index) => {
              if (weight.assetId.toLowerCase().includes("short")) {
                spotPrices.set(index, shortTokenValue);
              } else if (weight.assetId.toLowerCase().includes("long")) {
                spotPrices.set(index, longTokenValue);
              }
            });
            return spotPrices;
          } else {
            outcomeWeights.forEach((weight, index) => {
              if (index === Number(market.resolvedOutcome)) {
                spotPrices.set(index, new Decimal(1));
              } else {
                spotPrices.set(index, new Decimal(0));
              }
            });
            return spotPrices;
          }
        }
      }
    },
    {
      enabled: Boolean(
        sdk &&
          isRpcSdk(sdk) &&
          marketId != null &&
          pool &&
          balances?.length > 0,
      ),
    },
  );

  return query;
};
