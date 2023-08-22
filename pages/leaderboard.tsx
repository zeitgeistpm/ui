import { dehydrate, QueryClient } from "@tanstack/react-query";
import { FullHistoricalAccountBalanceFragment } from "@zeitgeistpm/indexer";
import {
  BaseAssetId,
  create,
  getMarketIdOf,
  IOMarketOutcomeAssetId,
  IOScalarAssetId,
  parseAssetId,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import Avatar from "components/ui/Avatar";
import Decimal from "decimal.js";
import { endpointOptions, graphQlEndpoint, ZTG } from "lib/constants";
import { getDisplayName } from "lib/gql/display-name";
import {
  getBaseAssetHistoricalPrices,
  lookupPrice,
} from "lib/gql/historical-prices";
import {
  avatarPartsKey,
  getAvatarParts,
} from "lib/hooks/queries/useAvatarParts";
import { calcScalarResolvedPrices } from "lib/util/calc-scalar-winnings";
import { createAvatarSdk } from "lib/util/create-avatar-sdk";
import { fetchAllPages } from "lib/util/fetch-all-pages";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { NextPage } from "next";
import Link from "next/link";

// Approach: aggregate base asset movements in and out of a market
// "In events": swaps, buy full set
// "Out events": swaps, sell full set, redeem

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
    markets: MarketSummary[];
  };
};

type Rank = {
  accountId: string;
  profitUsd: number;
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

export async function getStaticProps() {
  const [sdk, avatarSdk] = await Promise.all([
    create({
      provider: endpointOptions.map((e) => e.value),
      indexer: graphQlEndpoint,
      storage: ZeitgeistIpfs(),
    }),
    createAvatarSdk(),
  ]);

  const basePrices = await getBaseAssetHistoricalPrices();

  const markets = await fetchAllPages(async (pageNumber, limit) => {
    const { markets } = await sdk.indexer.markets({
      limit: limit,
      offset: pageNumber * limit,
    });
    return markets;
  });

  const historicalSwaps = await fetchAllPages(async (pageNumber, limit) => {
    const { historicalSwaps } = await sdk.indexer.historicalSwaps({
      limit: limit,
      offset: pageNumber * limit,
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
        where: { event_contains: "TokensRedeemed" },
        limit: limit,
        offset: pageNumber * limit,
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
            },
            { event_contains: "Deposited", assetId_not_contains: "pool" },
          ],
        },
        limit: limit,
        offset: pageNumber * limit,
      });
    return historicalAccountBalances;
  });

  const sellFullSetEvents = await fetchAllPages(async (pageNumber, limit) => {
    const { historicalAccountBalances } =
      await sdk.indexer.historicalAccountBalances({
        where: {
          event_contains: "SoldComplete",
        },
        limit: limit,
        offset: pageNumber * limit,
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

  const tradeProfits = Object.keys(
    tradersAggregatedByMarket,
  ).reduce<TradersSummary>((ranks, accountId) => {
    const trader = tradersAggregatedByMarket[accountId];

    const marketsSummary: MarketSummary[] = [];
    const profit = Object.keys(trader).reduce<Decimal>((total, marketId) => {
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
        return total.plus(usdProfitLoss);
      } else {
        return total;
      }
    }, new Decimal(0));

    return {
      ...ranks,
      [accountId]: {
        profitUsd: profit.div(ZTG).toNumber(),
        markets: marketsSummary,
      },
    };
  }, {});

  const rankings = Object.keys(tradeProfits)
    .reduce<Rank[]>((rankings, accountId) => {
      rankings.push({
        accountId,
        profitUsd: tradeProfits[accountId].profitUsd,
        markets: tradeProfits[accountId].markets,
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

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      rankings: top20.map((player, index) => ({
        ...player,
        name: names[index],
      })),
      revalidate: 10 * 60, //10min
    },
  };
}

const Leaderboard: NextPage<{
  rankings: Rank[];
}> = ({ rankings }) => {
  return (
    <div className="">
      <div className="font-bold text-3xl mb-[40px] w-full text-center">
        Most Profitable Traders
      </div>
      <div className="flex flex-col gap-y-5 justify-center items-center">
        {rankings.map((rank, index) => (
          <div
            key={index}
            className="flex flex-col bg-sky-100 py-3 px-4 sm:px-6 rounded-xl w-full max-w-[800px]"
          >
            <div className="flex items-center justify-center">
              <div className="mr-1 sm:mr-[20px] w-[20px] shrink-0">
                {index + 1}
              </div>
              <div className="shrink-0">
                <Avatar size={50} address={rank.accountId} />
              </div>
              <Link
                className="mx-ztg-15 text-xs sm:text-sm md:text-base truncate shrink"
                href={`/portfolio/${rank.accountId}`}
              >
                {rank.name ?? rank.accountId}
              </Link>
              <div className="ml-auto font-bold text-xs sm:text-sm md:text-base">
                ${rank.profitUsd.toFixed(0)}
              </div>
            </div>
            {/* <div>
              {rank.markets
                .sort((a, b) => b.profit - a.profit)
                // .slice(0, 1000) // todo move this server side
                .map((market) => (
                  <div>
                    <Link href={`markets/${market.marketId}`}>
                      {market.question}-{market.marketId}
                    </Link>
                    <div>
                      {formatNumberCompact(market.profit)}{" "}
                      {lookupAssetSymbol(market.baseAssetId)}
                    </div>
                  </div>
                ))}
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
