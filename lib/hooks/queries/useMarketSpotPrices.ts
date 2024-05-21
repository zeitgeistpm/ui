import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import { FullMarketFragment, ScoringRule } from "@zeitgeistpm/indexer";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calcSpotPrice } from "lib/math";
import { calculateSpotPrice } from "lib/util/amm2";
import { calcResolvedMarketPrices } from "lib/util/calc-resolved-market-prices";
import { useSdkv2 } from "../useSdkv2";
import { Amm2Pool, useAmm2Pool } from "./amm2/useAmm2Pool";
import { useAccountPoolAssetBalances } from "./useAccountPoolAssetBalances";
import { useMarket } from "./useMarket";
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

  const { data: amm2Pool } = useAmm2Pool(marketId);

  const enabled = isRpcSdk(sdk) && marketId != null && !!market;

  const query = useQuery(
    [
      id,
      marketSpotPricesKey,
      pool,
      blockNumber,
      balances,
      basePoolBalance,
      amm2Pool,
    ],
    async () => {
      if (!enabled) return;
      const spotPrices: MarketPrices =
        market?.status !== "Resolved"
          ? market.scoringRule === ScoringRule.AmmCdaHybrid
            ? calcMarketPricesAmm2(amm2Pool!)
            : calcMarketPrices(market, basePoolBalance!, balances!)
          : calcResolvedMarketPrices(market);

      return spotPrices;
    },
    {
      enabled: enabled,
    },
  );

  return query;
};

const calcMarketPricesAmm2 = (pool: Amm2Pool) => {
  const spotPrices: MarketPrices = new Map();

  Array.from(pool.reserves.values()).forEach((reserve, index) => {
    const spotPrice = calculateSpotPrice(reserve, pool.liquidity);

    if (!spotPrice.isNaN()) {
      spotPrices.set(index, spotPrice);
    }
  });

  return spotPrices;
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
      market.baseAsset.toLocaleLowerCase(),
  );

  //base weight is equal to the sum of all other assets
  const baseWeight = new Decimal(market?.pool.totalWeight ?? 0).div(2);

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
