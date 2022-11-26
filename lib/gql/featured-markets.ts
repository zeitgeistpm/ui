import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";

import { ZTG } from "lib/constants";
import { IndexedMarketCardData } from "components/markets/market-card";
import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import {
  MarketCategories,
  MarketCategory,
} from "components/markets/market-card/";

const getMarketIdsFromEnvVar = () => {
  try {
    const mIds = JSON.parse(process.env.NEXT_PUBLIC_FEATURED_MARKET_IDS);
    // this line *should not* be needed, but here just in case
    const marketIds = mIds.map((id) => Number(id));
    return marketIds;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const marketIds = getMarketIdsFromEnvVar();

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(where: { marketId_eq: $marketId }) {
      marketId
      pool {
        poolId
        volume
        baseAsset
      }
      outcomeAssets
      question
      creation
      img
      marketType {
        categorical
        scalar
      }
      categories {
        color
        name
        ticker
      }
      outcomeAssets
    }
  }
`;

const assetsQuery = gql`
  query Assets($poolId: Int) {
    assets(where: { poolId_eq: $poolId }) {
      poolId
      price
      assetId
    }
  }
`;

const getFeaturedMarkets = async (
  client: GraphQLClient,
): Promise<IndexedMarketCardData[]> => {
  // handles if we don't have any markets set
  if (marketIds.length === 0) return null;

  const featuredMarkets = await Promise.all(
    marketIds.map(async (id) => {
      const marketRes = await client.request<{
        markets: {
          pool: {
            poolId: number;
            volume: string;
            baseAsset: string;
          } | null;
          marketId: number;
          img: string;
          question: string;
          creation: MarketCreation;
          marketType: { [key: string]: string };
          categories: { color: string; name: string; ticker: string }[];
          outcomeAssets: string[];
        }[];
      }>(marketQuery, {
        marketId: id,
      });

      const market = marketRes.markets[0];
      const pool = market.pool;

      if (!pool) {
        const noPoolMarket: IndexedMarketCardData = {
          marketId: market.marketId,
          question: market.question,
          creation: market.creation,
          img: market.img,
          prediction: "None",
          volume: 0,
          baseAsset: "",
          categories: [],
        };

        return noPoolMarket;
      }
      const assetsRes = await client.request<{
        assets: {
          poolId: number;
          price: number;
        }[];
      }>(assetsQuery, {
        poolId: pool.poolId,
      });

      const assets = assetsRes.assets;

      let prediction: string;
      if (market.marketType.categorical) {
        let [highestPrice, highestPriceIndex] = [0, 0];
        assets.forEach((asset, index) => {
          if (asset.price > highestPrice) {
            highestPrice = asset.price;
            highestPriceIndex = index;
          }
        });

        highestPriceIndex = 0;
        prediction = market.categories[highestPriceIndex].name;
      } else {
        const bounds: number[] = market.marketType.scalar
          .split(",")
          .map((b) => Number(b));

        const range = Number(bounds[1]) - Number(bounds[0]);
        const significantDigits = bounds[1].toString().length;
        const longPrice = assets[0].price;
        const shortPrice = assets[1].price;

        const shortPricePrediction = range * (1 - shortPrice) + bounds[0];
        const longPricePrediction = range * longPrice + bounds[0];
        const averagePricePrediction =
          (longPricePrediction + shortPricePrediction) / 2;
        prediction = new Decimal(averagePricePrediction)
          .toSignificantDigits(significantDigits)
          .toString();
      }

      const marketCategories: MarketCategories = market.categories.map(
        (category, index) => {
          const marketCategory: MarketCategory = {
            ...category,
            assetId: market.outcomeAssets[index],
          };

          return marketCategory;
        },
      );

      const featuredMarket: IndexedMarketCardData = {
        marketId: market.marketId,
        question: market.question,
        creation: market.creation,
        img: market.img,
        prediction: prediction,
        volume: new Decimal(pool.volume).div(ZTG).toNumber(),
        baseAsset: pool.baseAsset,
        categories: marketCategories,
      };

      return featuredMarket;
    }),
  );

  return featuredMarkets;
};

export default getFeaturedMarkets;
