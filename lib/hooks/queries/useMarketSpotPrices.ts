import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
import { useSdkv2 } from "../useSdkv2";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket } from "./useMarket";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { calcResolvedMarketPrices } from "lib/util/calc-resolved-market-prices";
import { usePoolBaseBalance } from "./usePoolBaseBalance";

export const marketSpotPricesKey = "market-spot-prices";

export type MarketPrices = Map<number, Decimal>;

export const useMarketSpotPrices = (
  marketId?: number,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const { data: market } = useMarket(
    marketId != null ? { marketId } : undefined,
  );
  const pool = market?.pool ?? undefined;
  const { data: balances } = useAccountPoolAssetBalances(
    pool?.account.accountId,
    pool,
    blockNumber,
  );
  const { data: basePoolBalance } = usePoolBaseBalance(
    pool?.poolId,
    blockNumber,
  );

  const enabled =
    isRpcSdk(sdk) &&
    marketId != null &&
    !!pool &&
    !!market &&
    !!basePoolBalance &&
    !!balances &&
    balances.length !== 0;

  const query = useQuery(
    [id, marketSpotPricesKey, pool, blockNumber, balances, basePoolBalance],
    async () => {
      if (!enabled) return;
      const spotPrices: MarketPrices =
        market?.status !== "Resolved"
          ? calcMarketPrices(market, basePoolBalance, balances)
          : calcResolvedMarketPrices(market);

      return spotPrices;
    },
    {
      enabled: enabled,
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

  if (!market.pool) return spotPrices;

  const outcomeWeights = market.pool.weights.filter(
    (weight) =>
      weight.assetId.toLocaleLowerCase() !==
      market.pool?.baseAsset.toLocaleLowerCase(),
  );

  //base weight is equal to the sum of all other assets
  const baseWeight = new Decimal(market.pool.totalWeight).div(2);

  outcomeWeights.forEach((weight, index) => {
    const spotPrice = calcSpotPrice(
      basePoolBalance.toString(),
      baseWeight,
      balances[index].free.toString(),
      weight.weight,
      0,
    );

    if (!spotPrice.isNaN()) {
      spotPrices.set(index, spotPrice);
    }
  });

  return spotPrices;
};
