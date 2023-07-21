import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";

import { FullContext, ScalarRangeType, Sdk } from "@zeitgeistpm/sdk-next";
import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";
import { IndexedMarketCardData } from "components/markets/market-card/index";
import { ZTG } from "lib/constants";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";

import { getFeaturedMarketIds } from "lib/cms/get-featured-marketids";
import { getCurrentPrediction } from "lib/util/assets";
import { hiddenMarketIds } from "lib/constants/markets";
import { marketMetaFilter } from "./constants";
import { isPresent } from "lib/types";
import { getDisplayName } from "./display-name";

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(
      where: {
        marketId_eq: $marketId
        marketId_not_in: ${hiddenMarketIds}
        ${marketMetaFilter}
      }
    ) {
      marketId
      baseAsset
      creator
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
  sdk: Sdk<FullContext>,
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
          creator: string;
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
          creator: market.creator,
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
        creator: market.creator,
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

  const filterMarkets = featuredMarkets.filter(isPresent);

  const names = await getDisplayName(
    sdk,
    filterMarkets.map((m) => m.creator),
  );

  return filterMarkets.map((m, i) => ({
    ...m,
    creatorDisplayName: names[i],
  }));
};

export default getFeaturedMarkets;
