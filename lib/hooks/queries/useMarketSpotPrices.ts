import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
import { calcScalarResolvedPrices } from "lib/util/calc-scalar-winnings";
import { useSdkv2 } from "../useSdkv2";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket } from "./useMarket";
import { usePool } from "./usePool";
import { usePoolZtgBalance } from "./usePoolZtgBalance";

export const assetPricesKey = Symbol();

export const useMarketSpotPrices = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const { data: pool } = usePool({ marketId: marketId });
  const { data: market } = useMarket(marketId);

  const { data: balances } = useAccountPoolAssetBalances(pool?.accountId, pool);

  const query = useQuery(
    [id, assetPricesKey, pool],
    async () => {
      if (isRpcSdk(sdk)) {
        const spotPrices = new Map<number, Decimal>();
        if (market.status !== "Resolved") {
          const basePoolBalance = await sdk.context.api.query.system.account(
            pool.accountId,
          );

          //base weight is equal to the sum of all other assets
          const baseWeight = new Decimal(pool.totalWeight).div(2);

          //todo: pre filter weights to reduce repetition
          pool.weights.forEach((weight, index) => {
            if (
              weight.assetId.toLocaleLowerCase() !==
              pool.baseAsset.toLocaleLowerCase()
            ) {
              const spotPrice = calcSpotPrice(
                basePoolBalance.data.free.toString(),
                baseWeight,
                balances[index].free.toString(),
                weight.len,
                0,
              );

              spotPrices.set(index, spotPrice);
            }
          });
          return spotPrices;
        } else {
          console.log(market.marketType);

          if (market.marketType.scalar) {
            const { shortTokenValue, longTokenValue } =
              calcScalarResolvedPrices(
                new Decimal(market.marketType.scalar[0]),
                new Decimal(market.marketType.scalar[1]),
                new Decimal(market.resolvedOutcome),
              );

            console.log(shortTokenValue, longTokenValue);

            pool.weights.forEach((weight, index) => {
              if (
                weight.assetId.toLocaleLowerCase() !==
                pool.baseAsset.toLocaleLowerCase()
              ) {
                if (weight.assetId.includes("Short")) {
                  spotPrices.set(index, shortTokenValue);
                } else if (weight.assetId.includes("Long")) {
                  spotPrices.set(index, longTokenValue);
                }
              }
            });
            return spotPrices;
          } else {
            pool.weights.forEach((weight, index) => {
              if (
                weight.assetId.toLocaleLowerCase() !==
                pool.baseAsset.toLocaleLowerCase()
              ) {
                if (index === Number(market.resolvedOutcome)) {
                  spotPrices.set(index, new Decimal(1));
                } else {
                  spotPrices.set(index, new Decimal(0));
                }
              }
            });
            return spotPrices;
          }
        }
      }
      // else {
      //   return null;
      // }
    },
    {
      enabled: Boolean(
        sdk && isRpcSdk(sdk) && marketId && pool && balances?.length > 0,
      ),
    },
  );

  return query;
};
