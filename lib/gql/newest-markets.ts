import { ZTG } from "@zeitgeistpm/sdk-next";
import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { MarketOutcomes, MarketOutcome } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";

const marketsQuery = gql`
  query Market {
    markets(orderBy: id_DESC, limit: 8, where: { pool_isNull: false }) {
      marketId
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
      pool {
        baseAsset
        volume
        poolId
      }
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

const getNewestMarkets = async (
  client: GraphQLClient,
): Promise<IndexedMarketCardData[]> => {
  const marketsRes = await client.request<{
    markets: {
      marketId: number;
      img: string;
      question: string;
      creation: MarketCreation;
      marketType: { [key: string]: string };
      categories: { color: string; name: string; ticker: string }[];
      outcomeAssets: string[];
      pool: { baseAsset: string; volume: string; poolId: number };
    }[];
  }>(marketsQuery);

  const newestMarkets: IndexedMarketCardData[] = await Promise.all(
    marketsRes.markets.map(async (market) => {
      const assetsRes = await client.request<{
        assets: {
          poolId: number;
          price: number;
        }[];
      }>(assetsQuery, {
        poolId: market.pool.poolId,
      });

      const assets = assetsRes.assets;

      const prediction = getCurrentPrediction(assets, market);

      const marketCategories: MarketOutcomes = market.categories.map(
        (category, index) => {
          const asset = assets[index];
          const marketCategory: MarketOutcome = {
            ...category,
            assetId: market.outcomeAssets[index],
            price: asset.price,
          };

          return marketCategory;
        },
      );

      const newMarket: IndexedMarketCardData = {
        marketId: market.marketId,
        img: market.img,
        question: market.question,
        creation: market.creation,
        prediction: prediction,
        volume: new Decimal(market.pool.volume).div(ZTG).toNumber(),
        baseAsset: market.pool.baseAsset,
        outcomes: marketCategories,
      };

      return newMarket;
    }),
  );

  return newestMarkets;
};

export default getNewestMarkets;
