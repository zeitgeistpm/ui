import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";

import { TrendingMarketInfo } from "components/markets/TrendingMarketCard";
import { ZTG } from "lib/constants";

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
      poolId
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

const poolQuery = gql`
  query Pool($poolId: Int) {
    pools(where: { poolId_eq: $poolId }) {
      poolId
      volume
      baseAsset
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

const getFeaturedMarkets = async (client: GraphQLClient) => {
  // handles if we don't have any markets set
  if (marketIds.length === 0) return null;

  const featuredMarkets = await Promise.all(
    marketIds.map(async (id) => {
      const marketRes = await client.request(marketQuery, {
        marketId: id,
      });

      const market = marketRes.markets[0];

      // TODO: handle if the market doesn't have a pool attached
      const poolRes = await client.request(poolQuery, {
        poolId: market.poolId,
      });

      const pool = poolRes.pools[0];

      if (!pool) {
        const trendingMarket: TrendingMarketInfo = {
          marketId: market.marketId,
          name: market.slug,
          img: market.img,
          outcomes: market.marketType.categorical
            ? market.marketType.categorical.toString()
            : "Long/Short",
          prediction: "None",
          volume: "No Pool",
          baseAsset: "",
        };

        return trendingMarket;
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

  return featuredMarkets;
};

export default getFeaturedMarkets;
