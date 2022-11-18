import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";

const poolQuery = gql`
  query TrendingMarkets($dateTwoWeeksAgo: DateTime) {
    pools(
      limit: 3
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
          categories: { color: string; name: string }[];
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

      let prediction: string;
      if (market.marketType.categorical) {
        let [highestPrice, highestPriceIndex] = [0, 0];
        assets.forEach((asset, index) => {
          if (asset.price > highestPrice) {
            highestPrice = asset.price;
            highestPriceIndex = index;
          }
        });

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

      const trendingMarket: IndexedMarketCardData = {
        marketId: market.marketId,
        question: market.question,
        creation: market.creation,
        img: market.img,
        prediction: prediction,
        volume: new Decimal(pool.volume).div(ZTG).toNumber(),
        baseAsset: pool.baseAsset,
        categories: market.categories,
      };
      console.log(trendingMarket);

      return trendingMarket;
    }),
  );
  return trendingMarkets;
};

export default getTrendingMarkets;
