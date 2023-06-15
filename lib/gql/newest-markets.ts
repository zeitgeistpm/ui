import { ZTG } from "@zeitgeistpm/sdk-next";
import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";
import { MarketOutcomes, MarketOutcome } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { ScalarRangeType } from "@zeitgeistpm/sdk-next";
import { hiddenMarketIds } from "lib/constants/markets";
import { marketMetaFilter } from "./constants";

const marketsQuery = gql`
  query Market {
    markets(
      orderBy: id_DESC
      limit: 8
      where: {
        pool_isNull: false
        status_in: [Active, Proposed]
        ${marketMetaFilter}
        marketId_not_in: ${hiddenMarketIds}
      }
    ) {
      marketId
      outcomeAssets
      question
      creation
      img
      baseAsset
      creator
      marketType {
        categorical
        scalar
      }
      categories {
        color
        name
      }
      pool {
        volume
        poolId
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

const getNewestMarkets = async (
  client: GraphQLClient,
): Promise<IndexedMarketCardData[]> => {
  const marketsRes = await client.request<{
    markets: {
      marketId: number;
      img: string;
      question: string;
      creation: MarketCreation;
      baseAsset: string;
      marketType: { [key: string]: string };
      categories: { color: string; name: string }[];
      outcomeAssets: string[];
      pool: { volume: string; poolId: number };
      tags: [];
      creator: string;
      status: string;
      scalarType: ScalarRangeType;
      period: { end: string };
    }[];
  }>(marketsQuery);

  const newestMarkets: IndexedMarketCardData[] = await Promise.all(
    marketsRes.markets.map(async (market) => {
      const assetsRes = await client.request<{
        assets: {
          pool: { poolId: number };
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
        creator: market.creator,
        volume: new Decimal(market.pool.volume).div(ZTG).toNumber(),
        baseAsset: market.baseAsset,
        outcomes: marketCategories,
        pool: market.pool,
        marketType: market.marketType,
        scalarType: market.scalarType,
        tags: market.tags,
        status: market.status,
        endDate: market.period.end,
      };

      return newMarket;
    }),
  );

  return newestMarkets;
};

export default getNewestMarkets;
