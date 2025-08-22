import { FullMarketFragment } from "@zeitgeistpm/indexer";
import Decimal from "decimal.js";
import {
  MarketPrices,
  useMarketSpotPrices,
} from "lib/hooks/queries/useMarketSpotPrices";
import { calcScalarResolvedPrices } from "./calc-scalar-winnings";
import { parseAssetIdString } from "./parse-asset-id";
import { IOBaseAssetId, MarketId } from "@zeitgeistpm/sdk";

export const calcResolvedMarketPrices = (
  market: FullMarketFragment,
): MarketPrices => {
  const assetIds = market.assets
    .map((a) => parseAssetIdString(a.assetId))
    .filter((assetId) => IOBaseAssetId.is(assetId) === false);

  const { data } = useMarketSpotPrices(market.marketId);
  if (!data) return new Map();

  const spotPrices: MarketPrices = data;

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
      const scalarAsset = assetId as {
        ScalarOutcome: [MarketId, "Short" | "Long"];
      };

      if (scalarAsset.ScalarOutcome[1] === "Short") {
        spotPrices.set(index, shortTokenValue);
      } else if (scalarAsset.ScalarOutcome[1] === "Long") {
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
