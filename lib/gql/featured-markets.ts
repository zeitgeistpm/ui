import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import { FullContext, ScalarRangeType, Sdk } from "@zeitgeistpm/sdk";
import {
  IndexedMarketCardData,
  MarketType,
} from "components/markets/market-card/index";
import { ZTG } from "lib/constants";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { getCmsFeaturedMarkets } from "lib/cms/featured-markets";
import { isPresent } from "lib/types";
import { getCurrentPrediction } from "lib/util/assets";

const getFeaturedMarkets = async (
  client: GraphQLClient,
  sdk: Sdk<FullContext>,
): Promise<IndexedMarketCardData[]> => {
  const cmsFeaturedMarkets = await getCmsFeaturedMarkets();

  const { markets } = await sdk.indexer.markets({
    where: {
      marketId_in: cmsFeaturedMarkets.marketIds ?? [],
    },
  });

  let featuredMarkets: IndexedMarketCardData[] = markets.map((market) => {
    const marketCategories: MarketOutcomes =
      market.categories?.map((category, index) => {
        const asset = market.assets[index];
        const marketCategory: MarketOutcome = {
          name: category.name ?? "",
          assetId: market.outcomeAssets[index],
          price: asset?.price ?? 0,
        };

        return marketCategory;
      }) ?? [];

    const prediction = getCurrentPrediction(market.assets, market);

    const cardMarket: IndexedMarketCardData = {
      marketId: market.marketId,
      question: market.question ?? "",
      creation: market.creation,
      creator: market.creator,
      img: market.img ?? "",
      prediction: prediction,
      volume: new Decimal(market.volume ?? 0).div(ZTG).toNumber(),
      baseAsset: market.baseAsset,
      outcomes: marketCategories,
      pool: market.pool,
      neoPool: market.neoPool,
      marketType: market.marketType as MarketType,
      scalarType: (market.scalarType ?? null) as ScalarRangeType,
      tags: market.tags?.filter(isPresent) ?? [],
      status: market.status,
      endDate: market.period.end,
    };
    return cardMarket;
  });

  featuredMarkets.sort((a, b) => {
    return (
      cmsFeaturedMarkets.marketIds?.findIndex((m) => m === a.marketId) -
      cmsFeaturedMarkets.marketIds?.findIndex((m) => m === b.marketId)
    );
  });

  return featuredMarkets;
};

export default getFeaturedMarkets;
