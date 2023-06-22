import {
  BaseAssetId,
  create,
  getMarketIdOf,
  IOForeignAssetId,
  IOMarketOutcomeAssetId,
  parseAssetId,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import {
  endpointOptions,
  environment,
  graphQlEndpoint,
  ZTG,
} from "lib/constants";
import {
  FOREIGN_ASSET_METADATA,
  lookupAssetSymbol,
} from "lib/constants/foreign-asset";
import { NextPage } from "next";
import Link from "next/link";
import Avatar from "components/ui/Avatar";
import { formatNumberCompact } from "lib/util/format-compact";
import { parseAssetIdString } from "lib/util/parse-asset-id";

//todo:
// include buy/sell full set events
// styling

// Track trades, buy full set, sell full set,

// Buy Full Set events
// Deposited includes all assets
// DepositedEndowed includes all assets
// EndowedBoughtCompleteSet includes all assets
// BoughtCompleteSet only includes one asset

type Trade = {
  marketId: number;
  baseAssetIn: Decimal;
  baseAssetOut: Decimal;
  // assetIn?: AssetId;
  // assetOut?: AssetId;
  // type: "trade" | "redeem" | "sellFullSet" | "buyFullSet";
};

type AccountId = string;

type Traders = {
  [key: AccountId]: Trade[];
};

type MarketBaseDetails = {
  // baseAsset: BaseAssetId;
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
    profit: number;
    markets: MarketSummary[];
  };
};

type Rank = {
  accountId: string;
  profit: number;
  name?: string;
  markets: MarketSummary[];
};

type BasePrices = {
  [key: string | "ztg"]: [number, number][];
};
type Event = {
  accountId: string;
  assetId: string;
  blockNumber: number;
  dBalance: any;
  event: string;
  id: string;
  timestamp: any;
};

const convertEventToTrade = (event: Event) => {
  const assetId = parseAssetId(event.assetId).unwrap();
  console.log(event.event);
  const marketId = IOMarketOutcomeAssetId.is(assetId)
    ? getMarketIdOf(assetId)
    : undefined;

  if (marketId !== undefined) {
    if (event.event === "TokensRedeemed") {
      const trade: Trade = {
        marketId,
        // assetIn: assetId,
        // assetOut: { Ztg: null },
        baseAssetIn: new Decimal(0),
        baseAssetOut: new Decimal(event.dBalance).abs(),
        // type: "redeem",
      };
      return trade;
    } else if (event.event === "SoldCompleteSet") {
      const trade: Trade = {
        marketId,
        // assetIn: assetId,
        // assetOut: { Ztg: null },
        baseAssetIn: new Decimal(0),
        baseAssetOut: new Decimal(event.dBalance).abs(),
        // type: "redeem",
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
        // assetIn: assetId,
        // assetOut: { Ztg: null },
        baseAssetIn: new Decimal(event.dBalance).abs(),
        baseAssetOut: new Decimal(0),
        // type: "redeem",
      };
      return trade;
    }
  }
};
const datesAreOnSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const findPrice = (timestamp: number, prices: [number, number][]) => {
  const date = new Date(Number(timestamp));

  const price = prices.find((p) => {
    return datesAreOnSameDay(date, new Date(p[0]));
  });

  return price?.[1];
};

const lookupPrice = (
  basePrices: BasePrices,
  baseAsset: BaseAssetId,
  timestamp: number,
) => {
  //BSR has been live before some assets existed, so no price data is available
  if (environment === "staging") return 1;
  const prices = IOForeignAssetId.is(baseAsset)
    ? basePrices[baseAsset.ForeignAsset]
    : basePrices["ztg"];

  return findPrice(timestamp, prices);
};

const getBaseAssetHistoricalPrices = async (): Promise<BasePrices> => {
  const coinGeckoIds = [
    ...Object.values(FOREIGN_ASSET_METADATA).map((asset) => asset.coinGeckoId),
    "zeitgeist",
  ];

  const pricesRes = await Promise.all(
    coinGeckoIds.map((id) =>
      fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=max`,
      ),
    ),
  );

  const prices = await Promise.all(pricesRes.map((res) => res.json()));
  const assetIds = Object.keys(FOREIGN_ASSET_METADATA);

  const pricesObj = prices.reduce<BasePrices>((obj, assetPrices, index) => {
    obj[assetIds[index]] = assetPrices.prices;
    return obj;
  }, {});

  pricesObj["ztg"] = prices.at(-1).prices;

  return pricesObj;
};

export async function getStaticProps() {
  // const client = new GraphQLClient(graphQlEndpoint);
  // const sdk= await create(mainnet());
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const basePrices = await getBaseAssetHistoricalPrices();

  const { markets } = await sdk.indexer.markets();

  // const marketsMap = markets.reduce((mMap, market) => {
  //   return { ...mMap, [market.marketId]: market };
  // }, {});
  const { historicalSwaps } = await sdk.indexer.historicalSwaps({
    where: {
      accountId_eq: "dE1CBAKzrE1C9R6NkgdEUNgv1H9x4xgT39wzSnxCtX3FpSqS8",
    },
  });
  // console.log(historicalSwaps);

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
      // assetIn: assetInId,
      // assetOut: assetOutId,
      // amountIn: new Decimal(swap.assetAmountIn),
      // amountOut: new Decimal(swap.assetAmountOut),
      baseAssetIn:
        baseAssetSwapType === "in"
          ? new Decimal(swap.assetAmountIn)
          : new Decimal(0),
      baseAssetOut:
        baseAssetSwapType === "out"
          ? new Decimal(swap.assetAmountOut)
          : new Decimal(0),
      // type: "trade",
    };

    if (trades) {
      trades.push(trade);
      traders[swap.accountId] = trades;
    } else {
      traders[swap.accountId] = [trade];
    }

    return traders;
  }, {});

  const { historicalAccountBalances: redeemEvents } =
    await sdk.indexer.historicalAccountBalances({
      where: { event_contains: "TokensRedeemed" },
    });

  const { historicalAccountBalances: buyFullSetEvents } =
    await sdk.indexer.historicalAccountBalances({
      where: {
        OR: [
          {
            event_contains: "BoughtComplete",
          },
          {
            AND: [
              { event_contains: "Deposited", assetId_not_contains: "pool" },
            ],
          },
        ],
      },
    });

  const { historicalAccountBalances: sellFullSetEvents } =
    await sdk.indexer.historicalAccountBalances({
      where: {
        event_contains: "SoldComplete",
      },
    });

  console.time("t");
  const fullSetEvents = [
    ...buyFullSetEvents,

    // ...sellFullSetEvents
  ];
  console.log(fullSetEvents);

  const uniqueFullSetEvents = fullSetEvents.reduce<Event[]>(
    (uniqueEvents, event) => {
      console.log("event", event);

      const duplicateEvent = uniqueEvents.find(
        (entry) => entry.id === event.id,
      );

      console.log("duplicateEvent", duplicateEvent);

      if (!duplicateEvent) {
        uniqueEvents.push(event);
      }

      return uniqueEvents;
    },
    [],
  );
  console.log(uniqueFullSetEvents);

  [...redeemEvents, ...uniqueFullSetEvents].forEach((event) => {
    const trades = tradersWithSwaps[event.accountId];

    // probably this check is needed as accounts can aquire tokens via buy full sell or transfer
    if (trades) {
      const trade = convertEventToTrade(event);

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
      // let baseAssetSwapType: "in" | "out" | undefined;
      // let baseAssetAmount: Decimal | undefined;
      // let baseAsset: BaseAssetId | undefined;

      // if (IOBaseAssetId.is(swap.assetIn)) {
      //   baseAssetSwapType = "in";
      //   baseAssetAmount = swap.amountIn;
      //   baseAsset = swap.assetIn;
      // } else if (IOBaseAssetId.is(swap.assetOut)) {
      //   baseAssetSwapType = "out";
      //   baseAssetAmount = swap.amountOut;
      //   baseAsset = swap.assetOut;
      // }

      // if (!baseAssetSwapType || !baseAsset || !baseAssetAmount)
      //   return marketTotals;

      const total = marketTotals[swap.marketId];
      if (total != null) {
        marketTotals[swap.marketId] = {
          ...total,
          baseAssetIn: swap.baseAssetIn.plus(total.baseAssetIn),
          baseAssetOut: swap.baseAssetOut.plus(total.baseAssetOut),
        };
      } else {
        marketTotals[swap.marketId] = {
          // baseAsset: baseAsset,
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
      const marketTotal = trader[marketId];

      const market = markets.find((m) => m.marketId === Number(marketId));

      if (market?.status === "Resolved") {
        const diff = marketTotal.baseAssetOut.minus(marketTotal.baseAssetIn);
        console.log("marketId:", marketId);
        console.log("diff", diff.div(ZTG).toString());
        // console.log(marketTotal.baseAssetOut.div(ZTG).toString());
        // console.log(marketTotal.baseAssetIn.div(ZTG).toString());

        marketsSummary.push({
          question: market.question!,
          marketId: market.marketId,
          baseAssetId: parseAssetIdString(market.baseAsset) as BaseAssetId,
          profit: diff.div(ZTG).toNumber(),
        });

        const endTimestamp = market.period.end;

        const marketEndBaseAssetPrice = lookupPrice(
          basePrices,
          marketTotal.baseAsset,
          endTimestamp,
        );

        console.log("usdprice", marketEndBaseAssetPrice?.toFixed(2));

        const usdProfitLoss = diff.mul(marketEndBaseAssetPrice);
        return total.plus(usdProfitLoss);
      } else {
        return total;
      }
    }, new Decimal(0));

    return {
      ...ranks,
      [accountId]: {
        profit: profit.div(ZTG).toNumber(),
        markets: marketsSummary,
      },
    };
  }, {});

  const rankings = Object.keys(tradeProfits)
    .reduce<Rank[]>((rankings, accountId) => {
      rankings.push({
        accountId,
        profit: tradeProfits[accountId].profit,
        markets: tradeProfits[accountId].markets,
      });
      return rankings;
    }, [])
    .sort((a, b) => b.profit - a.profit);

  const top10 = rankings;
  // .slice(0, 100);

  const indentities = await Promise.all(
    top10.map((player) => sdk.api.query.identity.identityOf(player.accountId)),
  );

  const names: (string | undefined)[] = indentities.map(
    (i) => (i.toHuman() as any)?.info?.display.Raw,
  );

  return {
    props: {
      rankings: top10.map((player, index) => ({
        ...player,
        name: names[index] ?? null,
      })),
      revalidate: 10 * 60, //10min
    },
  };
}

const Leaderboard: NextPage<{
  rankings: Rank[];
}> = ({ rankings }) => {
  // console.log(rankings[0].markets);
  return (
    <div className="mx-0 sm:mx-[50px]">
      <div className="font-bold text-xl mb-[20px]">Most Profit</div>
      <div className="flex flex-col gap-y-5">
        {rankings.map((rank, index) => (
          <div className="flex flex-col">
            <div key={index} className="flex items-center justify-center">
              <div className="mr-[20px] w-[20px]">{index + 1}</div>
              <Link
                className="flex items-center"
                href={`/portfolio/${rank.accountId}`}
              >
                <Avatar size={50} address={rank.accountId} />
                <span className="ml-ztg-15">{rank.name ?? rank.accountId}</span>
              </Link>
              <div className="ml-auto font-bold">${rank.profit.toFixed(0)}</div>
            </div>
            <div>
              {rank.markets
                .sort((a, b) => b.profit - a.profit)
                // .slice(0, 1000) // todo move this server side
                .map((market) => (
                  <div>
                    <div>
                      {market.question}-{market.marketId}
                    </div>
                    <div>
                      {formatNumberCompact(market.profit)}{" "}
                      {lookupAssetSymbol(market.baseAssetId)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
