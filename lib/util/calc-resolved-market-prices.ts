import { FullMarketFragment, ScoringRule } from "@zeitgeistpm/indexer";
import Decimal from "decimal.js";
import { MarketPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { calcScalarResolvedPrices } from "./calc-scalar-winnings";

export const calcResolvedMarketPrices = (
  market: FullMarketFragment,
): MarketPrices => {
  const assetIds =
    market.scoringRule === ScoringRule.Lmsr
      ? market.neoPool?.account.balances.map((b) => b.assetId)
      : market.pool?.assets.map((a) => a.assetId);

  const spotPrices: MarketPrices = new Map();

  if (market.resolvedOutcome == null) return spotPrices;

  if (
    market.marketType.scalar &&
    market.marketType.scalar[0] != null &&
    market.marketType.scalar[1] != null
  ) {
    const { shortTokenValue, longTokenValue } = calcScalarResolvedPrices(
      new Decimal(market.marketType.scalar[0]),
      new Decimal(market.marketType.scalar[1]),
      new Decimal(market.resolvedOutcome),
    );

    assetIds?.forEach((assetId, index) => {
      if (assetId.toLowerCase().includes("short")) {
        spotPrices.set(index, shortTokenValue);
      } else if (assetId.toLowerCase().includes("long")) {
        spotPrices.set(index, longTokenValue);
      }
    });
    return spotPrices;
  } else {
    assetIds?.forEach((_, index) => {
      if (index === Number(market.resolvedOutcome)) {
        spotPrices.set(index, new Decimal(1));
      } else {
        spotPrices.set(index, new Decimal(0));
      }
    });
    return spotPrices;
  }
};
