import {
  MarketCreation,
  MarketsFilteringOptions,
  MarketsOrderBy,
  MarketsOrdering,
  MarketsPaginationOptions,
  MarketStatusText,
  ScalarRangeType,
} from "@zeitgeistpm/sdk/dist/types";
import { gql, GraphQLClient } from "graphql-request";
import MarketStore from "lib/stores/MarketStore";
import { MarketListQuery, MarketStatus } from "lib/types";
import { activeStatusesFromFilters } from "lib/util/market";

export const marketDetailsQuery = gql`
  fragment MarketDetails on Market {
    marketId
    description
    end
    creator
    creation
    oracle
    question
    slug
    tags
    status
    scalarType
    poolId
    categories {
      name
      ticker
      color
    }
    marketType {
      categorical
      scalar
    }
  }
`;

export type MarketPreload = {
  id: number;
  type: "scalar" | "categorical";
  description: string;
  creation: MarketCreation;
  slug: string;
  tags: string[] | null;
  status: MarketStatus;
  end: BigInt;
  question: string;
  preloaded: true;
  poolId: number | null;
  scalarType: ScalarRangeType | null;
  categories: { name: string; ticker: string; color: string }[];
  poolExists: boolean;
  bounds?: [number, number];
};

export class MarketPreloader {
  constructor(private graphQlClient: GraphQLClient) {}

  private async queryMarketPage(
    filteringOptions: MarketsFilteringOptions,
    paginationOptions: Partial<MarketsPaginationOptions>,
    countOnly = false,
  ): Promise<MarketPreload[]> {
    const { tags, searchText, creator, oracle, assetOwner } = filteringOptions;
    const liquidityOnly = filteringOptions.liquidityOnly ?? true;

    const { statuses, queries } = this.constructQueriesForMarketsFiltering(
      filteringOptions,
      countOnly,
    );

    const [totalCountQuery, marketsQuery] = queries;

    let assets: string[];
    if (assetOwner) {
      assets = await this.queryAccountAssets(assetOwner);
    }

    let pageSize: number;
    let pageNumber: number;
    let ordering: MarketsOrdering;
    let orderBy: MarketsOrderBy;

    if (paginationOptions) {
      ({ pageSize, pageNumber, ordering, orderBy } = paginationOptions);
    }

    ordering = ordering ?? "asc";
    orderBy = orderBy ?? "newest";
    pageNumber = pageNumber ?? 1;

    const offset = pageSize ? (pageNumber - 1) * pageSize : 0;
    let orderingStr = ordering.toUpperCase();
    if (orderBy === "newest") {
      orderingStr = ordering === "asc" ? "DESC" : "ASC";
    }
    const orderByQuery =
      orderBy === "newest" ? `marketId_${orderingStr}` : `end_${orderingStr}`;

    const variables = {
      statuses,
      tags,
      searchText,
      pageSize,
      offset,
      orderByQuery,
      creator,
      oracle,
      minPoolId: liquidityOnly ? 0 : undefined,
      assets,
    };

    const marketsData = await this.graphQlClient.request<{
      markets: MarketPreload[];
    }>(marketsQuery, variables);

    const queriedMarkets = marketsData.markets;

    const result = queriedMarkets.map((m) => {
      return this.constructMarketStoreFromQueryData(m);
    });

    return result;
  }

  /**
   * Queries subsquid indexer for market data with pagination.
   * @param param0 filtering options
   * @param paginationOptions pagination options
   * @returns collection of markets and total count for specified options
   */
  async filterMarkets(
    filteringOptions: MarketsFilteringOptions,
    paginationOptions: MarketsPaginationOptions = {
      ordering: "desc",
      orderBy: "newest",
      pageSize: 10,
      pageNumber: 1,
    },
  ): Promise<MarketPreload[]> {
    return this.queryMarketPage(filteringOptions, paginationOptions);
  }

  private constructQueriesForMarketsFiltering(
    filteringOptions: MarketsFilteringOptions,
    countOnly = false,
  ): {
    queries: string[];
    statuses: MarketStatusText[];
  } {
    // need this since `status_in` needs [String!] type which is `undefined` or non-empty array of strings
    // `statuses` variable is returned and used in queries as a variable
    const statuses = filteringOptions.statuses ?? [
      "Proposed",
      "Active",
      "Closed",
      "Disputed",
      "Reported",
      "Resolved",
    ];
    const { searchText } = filteringOptions;

    const whereSearchText = `slug_contains: ${
      searchText == null
        ? '""'
        : "$searchText, OR: { question_contains: $searchText },"
    }`;

    const { creator, oracle } = filteringOptions;

    const whereCreatorOrOracle = (() => {
      if (creator || oracle) {
        return `
        OR: [{ oracle_eq: $oracle } { creator_eq: $creator }]
      `;
      }
      return "";
    })();

    const where = `where: {
      status_in: $statuses ${whereSearchText}
      tags_containsAll: $tags
      ${whereCreatorOrOracle}
      creator_eq: $creator
      oracle_eq: $oracle
      poolId_gte: $minPoolId
      outcomeAssets_containsAny: $assets
    }`;

    const countQuery = gql`
      query TotalMarketsCountPreload(
        ${statuses.length > 0 ? "$statuses: [String!]" : ""}
        $tags: [String!]
        ${searchText == null ? "" : "$searchText: String!"}
        $creator: String
        $oracle: String
        $minPoolId: Int
        $assets: [String!]
      ) {
        marketsConnection(
          ${where}
          orderBy: id_ASC
        ) {
          totalCount
        }
      }
    `;

    if (countOnly) {
      return { statuses, queries: [countQuery] };
    }

    const filterQuery = gql`
      query MarketPagePreload(
        ${statuses.length > 0 ? "$statuses: [String!]" : ""}
        $tags: [String!]
        ${searchText == null ? "" : "$searchText: String!"}
        $pageSize: Int
        $offset: Int!
        $orderByQuery: [MarketOrderByInput!]
        $creator: String
        $oracle: String
        $minPoolId: Int
        $assets: [String!]
      ) {
        markets(
          ${where}
          limit: $pageSize
          offset: $offset
          orderBy: $orderByQuery
        ) {
          ...MarketDetails
        }
      }
      ${marketDetailsQuery}
    `;

    return {
      statuses,
      queries: [countQuery, filterQuery],
    };
  }

  private constructMarketStoreFromQueryData(
    data: MarketPreload,
  ): MarketPreload {
    return data;
  }

  private async queryAccountAssets(accountAddress: string): Promise<string[]> {
    const query1 = gql`
      query assetsForAccount($accountAddress: String!) {
        accountBalances(
          where: { account: { accountId_eq: $accountAddress }, balance_gt: 0 }
        ) {
          assetId
        }
      }
    `;

    const { accountBalances } = await this.graphQlClient.request<{
      accountBalances: {
        assetId: string;
      }[];
    }>(query1, { accountAddress });

    const assets = accountBalances.map((i) => i.assetId);
    return assets;
  }

  async fetchMarkets(
    query: MarketListQuery,
    address?: string,
  ): Promise<MarketPreload[]> {
    const { pagination, filter, sorting, myMarketsOnly, tag, searchText } =
      query;

    let orderBy: MarketsOrderBy;

    if (sorting.sortBy === "EndDate") {
      orderBy = "end";
    } else if (sorting.sortBy === "CreatedAt") {
      orderBy = "newest";
    } else {
      orderBy = "end";
    }

    let marketsData: any[];

    const statuses = activeStatusesFromFilters(filter);

    if (myMarketsOnly && address != null) {
      const filtersOff =
        filter.creator === false &&
        filter.oracle === false &&
        filter.hasAssets === false;

      const oracle = filtersOff || filter.oracle ? address : undefined;
      const creator = filtersOff || filter.creator ? address : undefined;
      const assetOwner = filtersOff || filter.hasAssets ? address : undefined;

      const filterBy = {
        oracle,
        creator,
        assetOwner,
        liquidityOnly: false,
      };
      marketsData = await this.filterMarkets(filterBy, {
        pageSize: pagination.pageSize * pagination.page,
        pageNumber: 1,
        ordering: sorting.order as MarketsOrdering,
        orderBy,
      });
    } else {
      marketsData = await this.filterMarkets(
        {
          statuses: statuses.length === 0 ? undefined : statuses,
          searchText,
          liquidityOnly: filter.HasLiquidityPool,
          tags: tag && [tag],
        },
        {
          pageSize: pagination.pageSize * pagination.page,
          pageNumber: 1,
          ordering: sorting.order as MarketsOrdering,
          orderBy,
        },
      );
    }

    let markets: MarketPreload[] = [];

    for (const data of marketsData) {
      const bounds: [number, number] | undefined = data.marketType["scalar"]
        ? data.marketType["scalar"].split(",").map((b) => Number(b))
        : undefined;
      markets = [
        ...markets,
        {
          ...data,
          id: data.marketId,
          preloaded: true,
          poolExists: data.poolId != null,
          type: data.marketType["scalar"] == null ? "categorical" : "scalar",
          bounds,
        },
      ];
    }

    return markets;
  }
}

export const isPreloadedMarket = (data: any): data is MarketPreload => {
  return data.preloaded === true;
};

export type MarketCardData = MarketStore | MarketPreload;
