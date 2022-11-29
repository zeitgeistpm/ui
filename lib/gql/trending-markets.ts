import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { MarketOutcomes, MarketOutcome } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";

const poolQuery = gql`
  query TrendingMarkets($dateTwoWeeksAgo: DateTime) {
    pools(
      limit: 10
      orderBy: volume_DESC
      where: { createdAt_gt: $dateTwoWeeksAgo, poolStatus_eq: "Active" }
    ) {
      volume
      marketId
      createdAt
      poolId
      baseAsset
    }
  }
`;

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(where: { marketId_eq: $marketId }) {
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

const getTrendingMarkets = async (
  client: GraphQLClient,
): Promise<IndexedMarketCardData[]> => {
  const dateTwoWeeksAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 14 * 1000,
  ).toISOString();

  const response = await client.request<{
    pools: {
      marketId: number;
      volume: number;
      poolId: number;
      baseAsset: string;
    }[];
  }>(poolQuery, {
    dateTwoWeeksAgo,
  });

  const trendingPools = response.pools;
  const trendingMarkets = await Promise.all(
    trendingPools.map(async (pool) => {
      const marketsRes = await client.request<{
        markets: {
          marketId: number;
          img: string;
          question: string;
          creation: MarketCreation;
          marketType: { [key: string]: string };
          categories: { color: string; name: string; ticker: string }[];
          outcomeAssets: string[];
        }[];
      }>(marketQuery, {
        marketId: pool.marketId,
      });

      const market = marketsRes.markets[0];

      const assetsRes = await client.request<{
        assets: {
          poolId: number;
          price: number;
        }[];
      }>(assetsQuery, {
        poolId: pool.poolId,
      });

      const assets = assetsRes.assets;

      const prediction = getCurrentPrediction(assets, market);

      const marketCategories: MarketOutcomes = market.categories.map(
        (category, index) => {
          const marketCategory: MarketOutcome = {
            ...category,
            assetId: market.outcomeAssets[index],
          };

          return marketCategory;
        },
      );

      const trendingMarket: IndexedMarketCardData = {
        marketId: market.marketId,
        question: market.question,
        creation: market.creation,
        img: market.img,
        prediction: prediction,
        volume: new Decimal(pool.volume).div(ZTG).toNumber(),
        baseAsset: pool.baseAsset,
        outcomes: marketCategories,
      };

      return trendingMarket;
    }),
  );
  return trendingMarkets;
};

export default getTrendingMarkets;
