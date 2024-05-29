import {
  MarketOrderByInput,
  MarketStatus,
  ScoringRule,
} from "@zeitgeistpm/indexer";
import {
  BaseAssetId,
  FullContext,
  IOForeignAssetId,
  Sdk,
} from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import Decimal from "decimal.js";
import { GraphQLClient, gql } from "graphql-request";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { hiddenMarketIds } from "lib/constants/markets";
import { marketMetaFilter } from "lib/hooks/queries/constants";
import {
  ForeignAssetPrices,
  getBaseAssetPrices,
} from "lib/hooks/queries/useAssetUsdPrice";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { fetchAllPages } from "lib/util/fetch-all-pages";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { FullMarketFragment } from "@zeitgeistpm/indexer";

const marketChangesQuery = gql`
  query MarketChanges($start: DateTime, $end: DateTime) {
    historicalMarkets(
      where: { timestamp_gt: $start, volume_gt: "0", timestamp_lt: $end }
      orderBy: id_DESC
    ) {
      dVolume
      market {
        marketId
      }
    }
  }
`;

const getTrendingMarkets = async (
  client: GraphQLClient,
  sdk: Sdk<FullContext>,
): Promise<FullMarketFragment[]> => {
  const now = new Date().toISOString();
  const dateOneWeekAgo = new Date(
    new Date().getTime() - DAY_SECONDS * 7 * 1000,
  ).toISOString();

  const { historicalMarkets } = await client.request<{
    historicalMarkets: {
      dVolume: string;
      market: {
        marketId: number;
      };
    }[];
  }>(marketChangesQuery, {
    start: dateOneWeekAgo,
    end: now,
  });

  const markets = await fetchAllPages(async (pageNumber, limit) => {
    const { markets } = await sdk.indexer.markets({
      limit: limit,
      offset: pageNumber * limit,
      order: MarketOrderByInput.IdDesc,
      where: {
        status_eq: MarketStatus.Active,
        ...marketMetaFilter,
      },
    });
    return markets;
  });

  const basePrices = await getBaseAssetPrices(sdk);

  const trendingMarketIds = calcTrendingMarkets(
    historicalMarkets,
    basePrices,
    markets,
  );

  const tm = trendingMarketIds.map((marketId) => {
    const market = markets.find(
      (market) => market.marketId === Number(marketId),
    );

    return market;
  });

  return tm.filter(isNotNull);
};

const lookupPrice = (
  basePrices: ForeignAssetPrices,
  baseAsset: BaseAssetId,
): Decimal | undefined => {
  return IOForeignAssetId.is(baseAsset)
    ? basePrices[baseAsset.ForeignAsset]
    : basePrices["ztg"];
};

const calcTrendingMarkets = (
  transactions: {
    market: {
      marketId: number;
    };
    dVolume: string;
  }[],
  basePrices: ForeignAssetPrices,
  markets: { marketId: number; baseAsset: string }[],
) => {
  const marketVolumes: { [key: string]: Decimal } = {};
  const maxMarkets = 4;

  // find total volume for each market
  transactions.forEach((transaction) => {
    const marketId = transaction.market.marketId;

    if (markets.some((market) => market.marketId === marketId)) {
      const volume = marketVolumes[marketId];
      if (volume) {
        marketVolumes[marketId] = volume.plus(transaction.dVolume);
      } else {
        marketVolumes[marketId] = new Decimal(transaction.dVolume);
      }
    }
  });

  for (let marketId in marketVolumes) {
    const base = markets.find((market) => market.marketId === Number(marketId))
      ?.baseAsset;

    const value = lookupPrice(
      basePrices,
      parseAssetIdString(base) as BaseAssetId,
    );

    marketVolumes[marketId] = marketVolumes[marketId].mul(value ?? 0);
  }

  const marketIdsByVolumeDesc = Object.keys(marketVolumes).sort((a, b) => {
    const aVol = marketVolumes[a];
    const bVol = marketVolumes[b];
    return bVol.minus(aVol).toNumber();
  });

  return marketIdsByVolumeDesc.splice(0, maxMarkets);
};

export default getTrendingMarkets;
