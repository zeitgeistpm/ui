import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";

import { ScalarRangeType } from "@zeitgeistpm/sdk-next";
import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import { ZTG } from "lib/constants";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";

import { getFeaturedMarketIds } from "lib/cms/get-featured-marketids";
import { getCurrentPrediction } from "lib/util/assets";
import { hiddenMarketIds } from "lib/constants/markets";

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(
      where: {
        marketId_eq: $marketId
        marketId_not_in: ${hiddenMarketIds}
        question_not_eq: ""
        question_isNull: false
        isMetaComplete_eq: true
      }
    ) {
      marketId
      baseAsset
      pool {
        poolId
        volume
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
      }
      tags
      period {
        end
      }
      status
      scalarType
    }
  }
`;

const assetsQuery = gql`
  query Assets($poolId: Int) {
    assets(where: { pool: { poolId_eq: $poolId } }) {
      pool {
        poolId
      }
      price
      assetId
    }
  }
`;

const getFeaturedMarkets = async (
  client: GraphQLClient,
): Promise<IndexedMarketCardData[]> => {
  const ids = await getFeaturedMarketIds();

  const featuredMarkets = await Promise.all(
    ids.map(async (id) => {
      const marketRes = await client.request<{
        markets: {
          pool: {
            poolId: number;
            volume: string;
          } | null;
          marketId: number;
          baseAsset: string;
          img: string;
          question: string;
          creation: MarketCreation;
          marketType: { [key: string]: string };
          scalarType: ScalarRangeType;
          categories: { color: string; name: string }[];
          outcomeAssets: string[];
          tags: [];
          status: string;
          period: { end: string };
        }[];
      }>(marketQuery, {
        marketId: id,
      });

      const market = marketRes.markets[0];

      if (!market) return;
      const pool = market.pool;

      if (!pool) {
        const noPoolMarket: IndexedMarketCardData = {
          marketId: market.marketId,
          question: market.question,
          creation: market.creation,
          pool: market.pool,
          img: market.img,
          prediction: { name: "None", price: 0 },
          marketType: market.marketType,
          scalarType: market.scalarType,
          volume: 0,
          baseAsset: market.baseAsset,
          outcomes: [],
          tags: [],
          status: market.status,
          endDate: market.period.end,
        };

        return noPoolMarket;
      }
      const assetsRes = await client.request<{
        assets: {
          pool: { poolId: number };
          price: number;
          assetId: string;
        }[];
      }>(assetsQuery, {
        poolId: pool.poolId,
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
      const featuredMarket: IndexedMarketCardData = {
        marketId: market.marketId,
        question: market.question,
        creation: market.creation,
        img: market.img,
        prediction: prediction,
        volume: new Decimal(pool.volume).div(ZTG).toNumber(),
        baseAsset: market.baseAsset,
        outcomes: marketCategories,
        pool: market.pool,
        marketType: market.marketType,
        scalarType: market.scalarType,
        tags: market.tags,
        status: market.status,
        endDate: market.period.end,
      };

      return featuredMarket;
    }),
  );

  return featuredMarkets.filter((market) => market !== undefined);
};

export default getFeaturedMarkets;
