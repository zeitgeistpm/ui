import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  MarketOrderByInput,
  MarketStatus,
  MarketWhereInput,
  ScoringRule,
} from "@zeitgeistpm/indexer";
import { IndexerContext, Market, isIndexedSdk } from "@zeitgeistpm/sdk";
import { hiddenMarketIds } from "lib/constants/markets";
import {
  MarketsListFiltersQuery,
  MarketsOrderBy,
} from "lib/types/market-filter";
import { MarketOutcomes } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { useSdkv2 } from "../useSdkv2";

import { marketMetaFilter } from "./constants";
import { marketsRootQuery } from "./useMarket";
import { marketCmsDatakeyForMarket } from "./cms/useMarketCmsMetadata";
import { CmsMarketMetadata } from "lib/cms/markets";

export const rootKey = "markets-filtered";

const orderByMap = {
  [MarketsOrderBy.Newest]: MarketOrderByInput.MarketIdDesc,
  [MarketsOrderBy.Oldest]: MarketOrderByInput.MarketIdAsc,
  [MarketsOrderBy.MostVolume]: MarketOrderByInput.VolumeDesc,
  [MarketsOrderBy.LeastVolume]: MarketOrderByInput.VolumeAsc,
};

const validMarketWhereInput: MarketWhereInput = {
  marketId_not_in: JSON.parse(hiddenMarketIds),
  ...marketMetaFilter,
};

export type QueryMarketData = Market<IndexerContext> & {
  outcomes: MarketOutcomes;
  prediction: { name: string; price: number };
};

const WHITELISTED_TRUSTED_CREATORS = [
  "dE2cVL9QAgh3MZEK3ZhPG5S2YSqZET8V1Qa36epaU4pQG4pd8",
];

export const useInfiniteMarkets = (
  orderBy: MarketsOrderBy,
  withLiquidityOnly = false,
  filters?: MarketsListFiltersQuery,
) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const limit = 12;
  const fetcher = async ({
    pageParam = 0,
  }): Promise<{ data: QueryMarketData[]; next: number | boolean }> => {
    if (
      !isIndexedSdk(sdk) ||
      filters == null ||
      orderBy == null ||
      withLiquidityOnly == null
    ) {
      return {
        data: [],
        next: false,
      };
    }

    const statuses = filters.status as MarketStatus[];
    const tags = filters.tag;
    const currencies = filters.currency;

    const markets: Market<IndexerContext>[] = await sdk.model.markets.list({
      where: {
        AND: [
          {
            ...validMarketWhereInput,
            status_not_in: [MarketStatus.Destroyed],
            status_in: statuses.length === 0 ? undefined : statuses,
            tags_containsAny: tags?.length === 0 ? undefined : tags,
            baseAsset_in: currencies?.length !== 0 ? currencies : undefined,
          },
          {
            disputeMechanism_isNull: false,
            OR: [
              {
                creator_in: WHITELISTED_TRUSTED_CREATORS,
              },
            ],
          },
          {
            OR: [
              {
                scoringRule_eq: ScoringRule.Cpmm,
                pool_isNull: withLiquidityOnly ? false : undefined,
                ...(withLiquidityOnly
                  ? {
                      pool: {
                        account: {
                          balances_some: {
                            balance_gt: 0,
                          },
                        },
                      },
                    }
                  : {}),
              },
              {
                scoringRule_eq: ScoringRule.Lmsr,
                neoPool_isNull: withLiquidityOnly ? false : undefined,
              },
            ],
          },
        ],
      },
      offset: !pageParam ? 0 : limit * pageParam,
      limit: limit,
      order: orderByMap[orderBy] as MarketOrderByInput, //todo: fix this type once sdk updated,
    });

    for (const market of markets) {
      const cmsData: CmsMarketMetadata | undefined = queryClient.getQueryData(
        marketCmsDatakeyForMarket(market.marketId),
      );
      if (cmsData?.question) market.question = cmsData.question;
      if (cmsData?.imageUrl) market.img = cmsData.imageUrl;
    }

    const resMarkets: Array<QueryMarketData> = markets.map((market) => {
      const outcomes: MarketOutcomes = market.assets.map((asset, index) => {
        return {
          price: asset.price,
          name: market.categories?.[index].name ?? "",
          assetId: asset.assetId,
          amountInPool: asset.amountInPool,
        };
      });

      const prediction = getCurrentPrediction(outcomes, market);

      return {
        ...market,
        outcomes,
        prediction,
      };
    });

    return {
      data: resMarkets,
      next: markets.length >= limit ? pageParam + 1 : false,
    };
  };

  const query = useInfiniteQuery({
    queryKey: [id, rootKey, filters, orderBy, withLiquidityOnly],
    queryFn: fetcher,
    enabled:
      isIndexedSdk(sdk) &&
      filters !== undefined &&
      orderBy !== undefined &&
      withLiquidityOnly !== undefined &&
      Boolean(sdk),
    getNextPageParam: (lastPage) => lastPage.next,
    onSuccess(data) {
      data.pages
        .flatMap((p) => p.data)
        .forEach((market) => {
          queryClient.setQueryData(
            [id, marketsRootQuery, market.marketId],
            market,
          );
        });
    },
    staleTime: 10_000,
  });

  return query;
};
