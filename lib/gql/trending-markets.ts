import { TrendingMarketInfo } from "components/markets/TrendingMarketCard";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";

const poolQuery = gql`
  query TrendingMarkets($dateTwoWeeksAgo: DateTime) {
    pools(
      limit: 3
      orderBy: volume_DESC
      where: { createdAt_gt: $dateTwoWeeksAgo }
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
      slug
      img
      marketType {
        categorical
        scalar
      }
      categories {
        ticker
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

const getTrendingMarkets = async (client: GraphQLClient) => {
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
  const trendingMarkets: TrendingMarketInfo[] = await Promise.all(
    trendingPools.map(async (pool) => {
      const marketsRes = await client.request<{
        markets: {
          marketId: number;
          img: string;
          slug: string;
          marketType: { [key: string]: string };
          categories: { ticker: string }[];
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

        prediction = market.categories[highestPriceIndex].ticker;
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

      const trendingMarket: TrendingMarketInfo = {
        marketId: market.marketId,
        name: market.slug,
        img: market.img,
        outcomes: market.marketType.categorical
          ? market.marketType.categorical.toString()
          : "Long/Short",
        prediction: prediction,
        volume: new Decimal(pool.volume).div(ZTG).toFixed(0),
        baseAsset: pool.baseAsset,
      };
      return trendingMarket;
    }),
  );
  return trendingMarkets;
};

export default getTrendingMarkets;
