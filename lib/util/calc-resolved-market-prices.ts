import { FullMarketFragment } from "@zeitgeistpm/indexer";
import Decimal from "decimal.js";
import { MarketPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { calcScalarResolvedPrices } from "./calc-scalar-winnings";

export const calcResolvedMarketPrices = (
  market: FullMarketFragment,
): MarketPrices => {
  const outcomeWeights = market.pool?.weights.filter(
    (weight) =>
      weight.assetId.toLocaleLowerCase() !==
      market.pool?.baseAsset.toLocaleLowerCase(),
  );
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

    outcomeWeights?.forEach((weight, index) => {
      if (weight.assetId.toLowerCase().includes("short")) {
        spotPrices.set(index, shortTokenValue);
      } else if (weight.assetId.toLowerCase().includes("long")) {
        spotPrices.set(index, longTokenValue);
      }
    });
    return spotPrices;
  } else {
    outcomeWeights?.forEach((_, index) => {
      if (index === Number(market.resolvedOutcome)) {
        spotPrices.set(index, new Decimal(1));
      } else {
        spotPrices.set(index, new Decimal(0));
      }
    });
    return spotPrices;
  }
};
