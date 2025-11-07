import { useQuery } from "@tanstack/react-query";
import { parseAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useSdkv2 } from "../useSdkv2";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useBalance } from "./useBalance";
import { useMarket, UseMarketFilter } from "./useMarket";
import { useMarketSpotPrices } from "./useMarketSpotPrices";

export const poolsLiqudityRootKey = "pool-liquidity";

//denominated in the pools base asset
export const usePoolLiquidity = (filter?: UseMarketFilter) => {
  const [sdk, id] = useSdkv2();
  const { data: market } = useMarket(filter);

  const { data: spotPrices } = useMarketSpotPrices(market?.marketId ?? 0);
  const { data: balances } = useAccountPoolAssetBalances(
    market?.pool?.account.accountId,
    market?.pool ?? undefined,
  );

  const baseAssetId = parseAssetIdString(market?.baseAsset);
  const { data: baseAssetBalance } = useBalance(
    market?.pool?.account.accountId,
    baseAssetId,
  );

  const query = useQuery(
    [id, poolsLiqudityRootKey, filter, spotPrices, balances, baseAssetBalance],
    async () => {
      if (balances && spotPrices && baseAssetBalance) {
        return balances
          .reduce((totalLiquidty, balance, index) => {
            const spotPrice = spotPrices.get(index) ?? new Decimal(1);
            return totalLiquidty.plus(spotPrice.mul(balance.free.toString()));
          }, new Decimal(0))
          .add(baseAssetBalance);
      }
    },
    {
      enabled: Boolean(
        sdk && market && spotPrices && balances && baseAssetBalance,
      ),
    },
  );

  return query;
};
