import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
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
  console.log(balances);

  const query = useQuery(
    [id, assetPricesKey, pool],
    async () => {
      if (isRpcSdk(sdk)) {
        const basePoolBalance = await sdk.context.api.query.system.account(
          pool.accountId,
        );

        //base weight is equal to the sum of all other assets
        const baseWeight = new Decimal(pool.totalWeight).div(2);

        const spotPrices = new Map<string, Decimal>();

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

            spotPrices.set(weight.assetId, spotPrice);
          }
        });
        return spotPrices;
      } else {
        return null;
      }
    },
    {
      enabled: Boolean(
        sdk && isRpcSdk(sdk) && marketId && pool && balances?.length > 0,
      ),
    },
  );

  return query;
};
