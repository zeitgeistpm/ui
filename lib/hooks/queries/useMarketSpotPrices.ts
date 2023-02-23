import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
import { useSdkv2 } from "../useSdkv2";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket } from "./useMarket";
import { useZtgBalance } from "./useZtgBalance";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { calcResolvedMarketPrices } from "lib/util/calc-resolved-market-prices";

export const marketSpotPricesKey = "market-spot-prices";

export type MarketPrices = Map<number, Decimal>;

export const useMarketSpotPrices = (marketId: number, blockNumber?: number) => {
  const [sdk, id] = useSdkv2();

  const { data: market } = useMarket({ marketId });
  const pool = market?.pool;
  const { data: balances } = useAccountPoolAssetBalances(
    pool?.accountId,
    pool,
    blockNumber,
  );
  const { data: basePoolBalance } = useZtgBalance(pool?.accountId, blockNumber);

  const query = useQuery(
    [id, marketSpotPricesKey, pool, blockNumber, balances, basePoolBalance],
    async () => {
      if (isRpcSdk(sdk) && basePoolBalance) {
        const spotPrices: MarketPrices =
          market.status !== "Resolved"
            ? calcMarketPrices(market, basePoolBalance, balances)
            : calcResolvedMarketPrices(market);

        return spotPrices;
      }
    },
    {
      enabled: Boolean(
        sdk &&
          isRpcSdk(sdk) &&
          marketId != null &&
          pool &&
          basePoolBalance &&
          balances?.length > 0,
      ),
    },
  );

  return query;
};

const calcMarketPrices = (
  market: FullMarketFragment,
  basePoolBalance: Decimal,
  balances: OrmlTokensAccountData[],
) => {
  const spotPrices: MarketPrices = new Map();

  const outcomeWeights = market.pool.weights.filter(
    (weight) =>
      weight.assetId.toLocaleLowerCase() !==
      market.pool.baseAsset.toLocaleLowerCase(),
  );

  //base weight is equal to the sum of all other assets
  const baseWeight = new Decimal(market.pool.totalWeight).div(2);

  outcomeWeights.forEach((weight, index) => {
    const spotPrice = calcSpotPrice(
      basePoolBalance.toString(),
      baseWeight,
      balances[index].free.toString(),
      weight.len,
      0,
    );

    spotPrices.set(index, spotPrice.isNaN() ? null : spotPrice);
  });

  return spotPrices;
};
