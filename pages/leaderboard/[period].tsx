import { dehydrate, QueryClient } from "@tanstack/react-query";
import {
  FullHistoricalAccountBalanceFragment,
  HistoricalAccountBalanceOrderByInput,
  HistoricalSwapOrderByInput,
  MarketOrderByInput,
} from "@zeitgeistpm/indexer";
import {
  BaseAssetId,
  create,
  getMarketIdOf,
  IOMarketOutcomeAssetId,
  IOScalarAssetId,
  parseAssetId,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import {
  DAY_SECONDS,
  endpointOptions,
  environment,
  graphQlEndpoint,
  ZTG,
} from "lib/constants";
import { getDisplayName } from "lib/gql/display-name";
import {
  getBaseAssetHistoricalPrices,
  lookupPrice,
} from "lib/gql/historical-prices";
import {
  avatarPartsKey,
  getAvatarParts,
} from "lib/hooks/queries/useAvatarParts";
import { shortenAddress } from "lib/util";
import { calcScalarResolvedPrices } from "lib/util/calc-scalar-winnings";
import { createAvatarSdk } from "lib/util/create-avatar-sdk";
import { fetchAllPages } from "lib/util/fetch-all-pages";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPlaiceholder } from "plaiceholder";
import { useMemo } from "react";

// Approach: aggregate base asset movements in and out of a market
// "In events": swaps, buy full set
// "Out events": swaps, sell full set, redeem

// const TimePeriodItems = ["month", "year", "all"] as const;
const TimePeriodItems = ["year"] as const;
type TimePeriod = (typeof TimePeriodItems)[number];

const durationLookup: { [key in TimePeriod]: number } = {
  // week: DAY_SECONDS * 1000 * 7,
  // month: DAY_SECONDS * 1000 * 30,
  year: DAY_SECONDS * 1000 * 365,
  // all: DAY_SECONDS * 1000 * 365 * 100,
};

type Trade = {
  marketId: number;
  baseAssetIn: Decimal;
  baseAssetOut: Decimal;
};

type AccountId = string;

type Traders = {
  [key: AccountId]: Trade[];
};

type MarketBaseDetails = {
  baseAssetIn: Decimal;
  baseAssetOut: Decimal;
};

type MarketTotals = {
  [key: MarketId]: MarketBaseDetails;
};

type MarketId = number;

type TradersByMarket = {
  [key: AccountId]: MarketTotals;
};

type MarketSummary = {
  marketId: number;
  question: string;
  baseAssetId: BaseAssetId;
  profit: number;
};

type TradersSummary = {
  [key: AccountId]: {
    profitUsd: number;
    volumeUsd: number;
    markets: MarketSummary[];
  };
};

type Rank = {
  accountId: string;
  profitUsd: number;
  volumeUsd: number;
  name?: string;
  markets: MarketSummary[];
};

const convertEventToTrade = (
  event: FullHistoricalAccountBalanceFragment,
  longTokenVaue?: Decimal,
  shortTokenVaue?: Decimal,
) => {
  const assetId = parseAssetId(event.assetId).unwrap();
  const marketId = IOMarketOutcomeAssetId.is(assetId)
    ? getMarketIdOf(assetId)
    : undefined;

  if (marketId !== undefined) {
    if (event.event === "TokensRedeemed") {
      const assetValue = IOScalarAssetId.is(assetId)
        ? assetId.ScalarOutcome[1] === "Short"
          ? shortTokenVaue
          : longTokenVaue
        : new Decimal(1);
      const trade: Trade = {
        marketId,
        baseAssetIn: new Decimal(0),
        baseAssetOut: new Decimal(event.dBalance).mul(assetValue ?? 1).abs(),
      };

      return trade;
    } else if (event.event === "SoldCompleteSet") {
      const trade: Trade = {
        marketId,
        baseAssetIn: new Decimal(0),
        baseAssetOut: new Decimal(event.dBalance).abs(),
      };
      return trade;
    } else if (
      event.event === "Deposited" ||
      event.event === "DepositedEndowed" ||
      event.event === "EndowedBoughtCompleteSet" ||
      event.event === "BoughtCompleteSet"
    ) {
      const trade: Trade = {
        marketId,
        baseAssetIn: new Decimal(event.dBalance).abs(),
        baseAssetOut: new Decimal(0),
      };
      return trade;
    }
  }
};

export async function getStaticPaths() {
  const paths = TimePeriodItems.map((timePeriod) => ({
    params: { period: timePeriod },
  }));
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const period: TimePeriod = params.period;
  const periodEnd = new Date();
  const periodDuration = durationLookup[period];
  const periodStart = new Date(periodEnd.getTime() - periodDuration);

  const [sdk, avatarSdk] = await Promise.all([
    create({
      provider: endpointOptions.map((e) => e.value),
      indexer: graphQlEndpoint,
      storage: ZeitgeistIpfs(),
    }),
    createAvatarSdk(),
  ]);

  const basePrices = await getBaseAssetHistoricalPrices();

  //markets that are running during the given period
  const markets = await fetchAllPages(async (pageNumber, limit) => {
    const { markets } = await sdk.indexer.markets({
      limit: limit,
      offset: pageNumber * limit,
      order: MarketOrderByInput.IdAsc,
    });
    return markets;
  });

  const historicalSwaps = await fetchAllPages(async (pageNumber, limit) => {
    const { historicalSwaps } = await sdk.indexer.historicalSwaps({
      limit: limit,
      offset: pageNumber * limit,
      order: HistoricalSwapOrderByInput.IdAsc,
      where: {
        timestamp_gt: periodStart.toISOString(),
      },
    });
    return historicalSwaps;
  });

  const tradersWithSwaps = historicalSwaps.reduce<Traders>((traders, swap) => {
    const trades = traders[swap.accountId];

    const assetInId = parseAssetId(swap.assetIn).unwrap();
    const assetOutId = parseAssetId(swap.assetOut).unwrap();
    let baseAssetSwapType: "in" | "out" | undefined;

    let marketId: number | undefined;
    if (IOMarketOutcomeAssetId.is(assetInId)) {
      marketId = getMarketIdOf(assetInId);
      baseAssetSwapType = "out";
    } else if (IOMarketOutcomeAssetId.is(assetOutId)) {
      marketId = getMarketIdOf(assetOutId);
      baseAssetSwapType = "in";
    }

    if (marketId === undefined) return traders;

    const trade: Trade = {
      marketId,
      baseAssetIn:
        baseAssetSwapType === "in"
          ? new Decimal(swap.assetAmountIn)
          : new Decimal(0),
      baseAssetOut:
        baseAssetSwapType === "out"
          ? new Decimal(swap.assetAmountOut)
          : new Decimal(0),
    };

    if (trades) {
      trades.push(trade);
      traders[swap.accountId] = trades;
    } else {
      traders[swap.accountId] = [trade];
    }

    return traders;
  }, {});

  const redeemEvents = await fetchAllPages(async (pageNumber, limit) => {
    const { historicalAccountBalances } =
      await sdk.indexer.historicalAccountBalances({
        where: {
          event_contains: "TokensRedeemed",
          timestamp_gt: periodStart.toISOString(),
        },
        limit: limit,
        offset: pageNumber * limit,
        order: HistoricalAccountBalanceOrderByInput.IdAsc,
      });
    return historicalAccountBalances;
  });

  const buyFullSetEvents = await fetchAllPages(async (pageNumber, limit) => {
    const { historicalAccountBalances } =
      await sdk.indexer.historicalAccountBalances({
        where: {
          OR: [
            {
              event_contains: "BoughtComplete",
              timestamp_gt: periodStart.toISOString(),
            },
            {
              event_contains: "Deposited",
              assetId_not_contains: "pool",
              timestamp_gt: periodStart.toISOString(),
            },
          ],
        },
        limit: limit,
        offset: pageNumber * limit,
        order: HistoricalAccountBalanceOrderByInput.IdAsc,
      });
    return historicalAccountBalances;
  });

  const sellFullSetEvents = await fetchAllPages(async (pageNumber, limit) => {
    const { historicalAccountBalances } =
      await sdk.indexer.historicalAccountBalances({
        where: {
          event_contains: "SoldComplete",
          timestamp_gt: periodStart.toISOString(),
        },
        limit: limit,
        offset: pageNumber * limit,
        order: HistoricalAccountBalanceOrderByInput.IdAsc,
      });
    return historicalAccountBalances;
  });

  const fullSetEvents = [...buyFullSetEvents, ...sellFullSetEvents];

  const uniqueFullSetEvents = fullSetEvents.reduce<
    FullHistoricalAccountBalanceFragment[]
  >((uniqueEvents, event) => {
    const duplicateEvent = uniqueEvents.find(
      (entry) => entry.extrinsic?.hash === event.extrinsic?.hash,
    );

    if (!duplicateEvent) {
      uniqueEvents.push(event);
    }

    return uniqueEvents;
  }, []);

  uniqueFullSetEvents.forEach((event) => {
    const trades = tradersWithSwaps[event.accountId];

    // this check is needed as accounts can aquire tokens via buy full sell or transfer
    if (trades) {
      const trade = convertEventToTrade(event);

      if (trade) trades.push(trade);

      tradersWithSwaps[event.accountId] = trades;
    }
  });

  redeemEvents.forEach((event) => {
    const trades = tradersWithSwaps[event.accountId];

    const assetId = parseAssetIdString(event.assetId);

    const market = IOMarketOutcomeAssetId.is(assetId)
      ? markets.find((m) => m.marketId === Number(getMarketIdOf(assetId)))
      : null;
    if (trades && market) {
      const values =
        market.marketType.scalar?.[0] != null &&
        market.marketType.scalar[1] != null &&
        market.resolvedOutcome != null
          ? calcScalarResolvedPrices(
              new Decimal(market.marketType.scalar[0]),
              new Decimal(market.marketType.scalar[1]),
              new Decimal(market.resolvedOutcome),
            )
          : { longTokenValue: undefined, shortTokenValue: undefined };

      const trade = convertEventToTrade(
        event,
        values.longTokenValue,
        values.shortTokenValue,
      );

      if (trade) trades.push(trade);

      tradersWithSwaps[event.accountId] = trades;
    }
  });

  //loop through accounts and trades, total up baseAsset in and out for each market
  const tradersAggregatedByMarket = Object.keys(
    tradersWithSwaps,
  ).reduce<TradersByMarket>((traders, accountId) => {
    const swaps = tradersWithSwaps[accountId];
    if (!swaps) return traders;

    const marketTotal = swaps.reduce<MarketTotals>((marketTotals, swap) => {
      const total = marketTotals[swap.marketId];
      if (total != null) {
        marketTotals[swap.marketId] = {
          ...total,
          baseAssetIn: swap.baseAssetIn.plus(total.baseAssetIn),
          baseAssetOut: swap.baseAssetOut.plus(total.baseAssetOut),
        };
      } else {
        marketTotals[swap.marketId] = {
          baseAssetIn: swap.baseAssetIn,
          baseAssetOut: swap.baseAssetOut,
        };
      }
      return marketTotals;
    }, {});

    return { ...traders, [accountId]: marketTotal };
  }, {});

  const tradersSummaries = Object.keys(
    tradersAggregatedByMarket,
  ).reduce<TradersSummary>((ranks, accountId) => {
    const trader = tradersAggregatedByMarket[accountId];

    const marketsSummary: MarketSummary[] = [];

    let profit = new Decimal(0);
    let volume = new Decimal(0);

    for (const marketId of Object.keys(trader)) {
      const marketTotal: MarketBaseDetails = trader[marketId];

      const market = markets.find((m) => m.marketId === Number(marketId));

      const suspiciousActivity = marketTotal.baseAssetIn.eq(0);

      if (market?.status === "Resolved" && !suspiciousActivity) {
        const diff = marketTotal.baseAssetOut.minus(marketTotal.baseAssetIn);

        marketsSummary.push({
          question: market.question!,
          marketId: market.marketId,
          baseAssetId: parseAssetIdString(market.baseAsset) as BaseAssetId,
          profit: diff.div(ZTG).toNumber(),
        });

        const endTimestamp = market.period.end;

        const marketEndBaseAssetPrice = lookupPrice(
          basePrices,
          parseAssetIdString(market.baseAsset) as BaseAssetId,
          endTimestamp,
        );

        const usdProfitLoss = diff.mul(marketEndBaseAssetPrice ?? 0);
        volume = volume.plus(
          marketTotal.baseAssetIn
            .plus(marketTotal.baseAssetOut)
            .mul(marketEndBaseAssetPrice ?? 0),
        );

        profit = profit.plus(usdProfitLoss);
      }
    }

    return {
      ...ranks,
      [accountId]: {
        profitUsd: profit.div(ZTG).toNumber(),
        volumeUsd: volume.div(ZTG).toNumber(),
        markets: marketsSummary,
      },
    };
  }, {});

  const rankings = Object.keys(tradersSummaries)
    .reduce<Rank[]>((rankings, accountId) => {
      rankings.push({
        accountId,
        profitUsd: tradersSummaries[accountId].profitUsd,
        markets: tradersSummaries[accountId].markets,
        volumeUsd: tradersSummaries[accountId].volumeUsd,
      });
      return rankings;
    }, [])
    .sort((a, b) => b.profitUsd - a.profitUsd);

  const top20 = rankings.slice(0, 20);

  const names = await getDisplayName(
    sdk,
    top20.map((p) => p.accountId),
  );

  const queryClient = new QueryClient();

  await Promise.all(
    top20.map((player) =>
      queryClient.prefetchQuery([avatarPartsKey, player.accountId], () =>
        getAvatarParts(avatarSdk, player.accountId),
      ),
    ),
  );

  //todo: need to solve coin gecko rate limit issue
  // const trendingMarkets = await getTrendingMarkets(sdk.indexer.client, sdk);

  const bannerPlaceholder = await getPlaiceholder("/Leaderboard-banner.png", {
    size: 16,
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      rankings: top20.map((player, index) => ({
        ...player,
        name: names[index],
      })),
      // trendingMarkets,
      timePeriod: period,
      bannerPlaceholder: bannerPlaceholder.base64,
    },
    revalidate: 60 * 60 * 24, //1 day
  };
}

const columns: TableColumn[] = [
  {
    header: "Rank",
    accessor: "rank",
    type: "number",
  },
  {
    header: "User",
    accessor: "user",
    type: "component",
  },
  {
    header: "Markets Won",
    accessor: "numMarketsWon",
    type: "number",
  },
  {
    header: "Total Profit",
    accessor: "totalProfit",
    type: "text",
    collapseOrder: 2,
  },
  { header: "Volume", accessor: "volume", type: "text", collapseOrder: 1 },
];

const UserCell = ({ address, name }: { address: string; name?: string }) => {
  return (
    <div className="flex items-center">
      <div className="hidden sm:block">
        <Avatar size={40} address={address} />
      </div>
      <Link
        className="ml-2 md:w-[300px] lg:w-auto"
        href={`/portfolio/${address}`}
      >
        <span className="hidden lg:inline">{name ?? address}</span>
        <span className="hidden md:inline lg:hidden">
          {name ?? shortenAddress(address, 12, 12)}
        </span>
        <span className="block w-[100px] shrink truncate md:hidden">
          {name ?? shortenAddress(address, 3, 3)}
        </span>
      </Link>
    </div>
  );
};

const Leaderboard: NextPage<{
  rankings: Rank[];
  bannerPlaceholder: string;
  // trendingMarkets: IndexedMarketCardData[];
  timePeriod: TimePeriod;
}> = ({ rankings, timePeriod, bannerPlaceholder }) => {
  const tableData = useMemo<TableData[]>(() => {
    let res: TableData[] = [];
    for (const [index, rankObj] of rankings.entries()) {
      res = [
        ...res,
        {
          rank: index + 1,
          user: <UserCell address={rankObj.accountId} name={rankObj.name} />,
          numMarketsWon: rankObj.markets.filter((m) => m.profit > 0).length,
          totalProfit: `$${rankObj.profitUsd.toFixed(0)}`,
          volume: `$${rankObj.volumeUsd.toFixed(0)}`,
        },
      ];
    }
    return res;
  }, [rankings]);

  return (
    <div id="leaderboard" className="pt-4">
      <div className="relative h-[137px] w-full overflow-hidden rounded-md sm:h-[244px]">
        <Image
          src="/Leaderboard-banner.png"
          alt="Leaderboard-banner"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "top" }}
          blurDataURL={bannerPlaceholder}
          placeholder="blur"
        />
      </div>
      <h2 className="my-8 w-full text-[24px] font-bold">
        Leaderboard (Top 20)
      </h2>
      <div className="mb-8 flex gap-7 border-b-1 border-misty-harbor text-[18px] text-sky-600">
        {TimePeriodItems.map((period) => (
          <Link
            scroll={false}
            key={period}
            href={`/leaderboard/${period}`}
            className={`pb-4 capitalize ${
              period === timePeriod ? "font-semibold text-black" : ""
            }`}
          >
            {period}
          </Link>
        ))}
      </div>
      <Table columns={columns} data={tableData} showHighlight={false} />
      {/* {trendingMarkets.length > 0 && (
        <div className="my-[60px]">
          <MarketScroll
            title="Trending Markets"
            cta="Go to Markets"
            markets={trendingMarkets}
            link="/markets"
          />
        </div>
      )} */}
    </div>
  );
};

export default Leaderboard;
