import { MarketStatus, ScalarRangeType } from "@zeitgeistpm/sdk";
import { MarketReport, FullMarketFragment, ZeitgeistIndexer } from "@zeitgeistpm/indexer";
import { gql, GraphQLClient } from "graphql-request";
import { DAY_SECONDS } from "lib/constants";
import { marketMetaFilter } from "./constants";
import { MarketDispute } from "lib/types/markets";
import type { PortableTextBlock } from "@portabletext/types";

const marketIdsQuery = gql`
  query MarketIds($end: BigInt) {
    markets(where: { period: { end_gt: $end } }) {
      marketId
    }
  }
`;

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(
      where: {
        marketId_eq: $marketId
        ${marketMetaFilter}
      }
    ) {
      marketId
      description
      baseAsset
      volume
      pool {
        poolId
        createdAt
        baseAsset
      }
      neoPool {
        createdAt
        collateral
        poolId
      }
      question
      slug
      status
      outcomeAssets
      scalarType
      creator
      oracle
      disputeMechanism
      resolvedOutcome
      marketType {
        scalar
        categorical
      }
      disputes {
        at
        by
        outcome {
          scalar
          categorical
        }
      }
      report {
        at
        by
        outcome {
          scalar
          categorical
        }
      }
      period {
        block
        start
        end
      }
      deadlines {
        disputeDuration
        gracePeriod
        oracleDuration
      }
      categories {
        name
        color
      }
      tags
    }
  }
`;

export type MarketPageIndexedData = {
  marketId: number;
  slug: string;
  question: string;
  description: string | PortableTextBlock[];
  status: MarketStatus;
  volume: string;
  period: {
    block: string[];
    start: string;
    end: string;
  };
  deadlines: {
    disputeDuration: string;
    gracePeriod: string;
    oracleDuration: string;
  } | null;
  categories: { name: string; color: string }[];
  outcomeAssets: string[];
  resolvedOutcome: string;
  pool?: {
    poolId: number;
    createdAt: string;
    baseAsset: string;
  };
  neoPool?: {
    collateral: string;
    createdAt: string;
    poolId: number;
  };
  scalarType: ScalarRangeType;
  marketType: {
    scalar: string[];
    categorical: string;
  };
  disputes: MarketDispute[];
  report: MarketReport;
  creator: string;
  oracle: string;
  tags: [];
  baseAsset: string;
  disputeMechanism: "SimpleDisputes" | "Authorized" | "Court";
  img?: string;
} & (WithCmsEdits | NoCmsEdits);

export type WithCmsEdits = {
  hasEdits?: true;
  originalMetadata: {
    question?: string;
    description?: string;
  };
};

export type NoCmsEdits = {
  hasEdits?: false;
};

export const getRecentMarketIds = async (
  client: GraphQLClient,
): Promise<number[]> => {
  const timestampOneMonthAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 31 * 1000,
  ).getTime();

  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(marketIdsQuery, {
    end: timestampOneMonthAgo,
  });

  return response.markets.map((m) => m.marketId);
};

export const getMarket = async (client: GraphQLClient, marketId: string) => {
  const response = await client.request<{
    markets: MarketPageIndexedData[];
  }>(marketQuery, {
    marketId: Number(marketId),
  });

  return response.markets[0];
};

export const checkMarketExists = async (
  client: GraphQLClient,
  marketId: number,
): Promise<boolean> => {
  const response = await client.request<{
    markets: {
      marketId: number;
    }[];
  }>(
    gql`
      query Market($marketId: Int) {
        markets(where: { marketId_eq: $marketId }) {
          marketId
        }
      }
    `,
    {
      marketId: marketId,
    },
  );
  return response.markets.length > 0;
};
