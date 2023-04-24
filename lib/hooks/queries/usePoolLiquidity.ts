import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket, UseMarketFilter } from "./useMarket";
import { useMarketSpotPrices } from "./useMarketSpotPrices";

export const poolsLiqudityRootKey = "pool-liquidity";

//denominated in the pools base asset
export const usePoolLiquidity = (filter?: UseMarketFilter) => {
  const [sdk, id] = useSdkv2();
  const { data: market } = useMarket(filter);

  const { data: spotPrices } = useMarketSpotPrices(market?.marketId);
  const { data: balances } = useAccountPoolAssetBalances(
    market?.pool?.accountId,
    market?.pool,
  );

  const query = useQuery(
    [id, poolsLiqudityRootKey, filter, spotPrices, balances],
    async () => {
      return balances.reduce((totalLiquidty, balance, index) => {
        const spotPrice = spotPrices.get(index) ?? new Decimal(1);
        return totalLiquidty.plus(spotPrice.mul(balance.free.toString()));
      }, new Decimal(0));
    },
    {
      enabled: Boolean(sdk && market && spotPrices && balances),
    },
  );

  return query;
};
