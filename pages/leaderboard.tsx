import {
  AssetId,
  create,
  getMarketIdOf,
  IOBaseAssetId,
  IOMarketOutcomeAssetId,
  parseAssetId,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { NextPage } from "next";

type Trade = {
  marketId: number;
  // baseAsset: AssetId;
  amountIn: Decimal;
  amountOut: Decimal;
  assetIn: AssetId;
  assetOut: AssetId;
  type: "trade" | "redeem";
};

type AccountId = string;

type Traders = {
  [key: AccountId]: Trade[];
};

type MarketTotals = {
  [key: MarketId]: {
    // marketId: number;
    baseAsset: AssetId;
    baseAssetIn: Decimal;
    baseAssetOut: Decimal;
  };
};

type MarketId = number;

type TradersByMarket = {
  [key: AccountId]: MarketTotals;
};

type Ranked = {
  accountId: string;
  profit: Decimal;
};

export async function getStaticProps() {
  // const client = new GraphQLClient(graphQlEndpoint);
  // const sdk= await create(mainnet());
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const { historicalSwaps } = await sdk.indexer.historicalSwaps({
    where: {
      // accountId_eq: "dDywmamjrDkaT18ybCRJBfax65CoxJNSWGZfwiQrbkAe95wq3",
    },
  });
  console.log(historicalSwaps);

  const tradersWithSwaps = historicalSwaps.reduce<Traders>(
    (traders, swap, index) => {
      const trades = traders[swap.accountId];

      const assetInId = parseAssetId(swap.assetIn).unwrap();
      const assetOutId = parseAssetId(swap.assetOut).unwrap();

      let marketId: number | undefined;
      let baseAsset: AssetId | undefined;
      if (IOMarketOutcomeAssetId.is(assetInId)) {
        marketId = getMarketIdOf(assetInId);
        baseAsset = assetOutId;
      } else if (IOMarketOutcomeAssetId.is(assetOutId)) {
        marketId = getMarketIdOf(assetOutId);
        baseAsset = assetInId;
      }

      const trade: Trade = {
        marketId,
        // baseAsset: baseAsset,
        assetIn: assetInId,
        assetOut: assetOutId,
        amountIn: new Decimal(swap.assetAmountIn),
        amountOut: new Decimal(swap.assetAmountOut),
        type: "trade",
      };

      if (trades) {
        trades.push(trade);

        traders[swap.accountId] = trades;
      } else {
        traders[swap.accountId] = [trade];
      }

      return traders;
    },
    {},
  );

  console.log(tradersWithSwaps);
  const { historicalAccountBalances: redeemEvents } =
    await sdk.indexer.historicalAccountBalances({
      where: { event_contains: "TokensRedeemed" },
    });

  console.log(redeemEvents);
  redeemEvents.forEach((redeem) => {
    const trades = tradersWithSwaps[redeem.accountId];

    // probably this check is needed as accounts can aquire tokens via buy full sell or transfer
    if (trades) {
      const assetInId = parseAssetId(redeem.assetId).unwrap();

      const marketId = IOMarketOutcomeAssetId.is(assetInId)
        ? getMarketIdOf(assetInId)
        : undefined;
      const redeemTrade: Trade = {
        marketId,
        // baseAsset: baseAsset,
        assetIn: assetInId,
        assetOut: { Ztg: null },
        amountIn: new Decimal(redeem.dBalance).abs(),
        amountOut: new Decimal(redeem.dBalance).abs(),
        type: "redeem",
      };

      trades.push(redeemTrade);

      tradersWithSwaps[redeem.accountId] = trades;
    }
  });

  //loop through accounts and trades, total up baseAsset in and out for each market
  const tradersAggregatedByMarket = Object.keys(
    tradersWithSwaps,
  ).reduce<TradersByMarket>((traders, accountId, index) => {
    const swaps = tradersWithSwaps[accountId];
    if (!swaps) return traders;

    const marketTotal = swaps.reduce<MarketTotals>((markets, swap) => {
      let baseAssetSwapType: "in" | "out" | undefined;
      let baseAssetAmount: Decimal | undefined;
      let baseAsset: AssetId;

      if (IOBaseAssetId.is(swap.assetIn)) {
        baseAssetSwapType = "in";
        baseAssetAmount = swap.amountIn;
        baseAsset = swap.assetIn;
      } else if (IOBaseAssetId.is(swap.assetOut)) {
        baseAssetSwapType = "out";
        baseAssetAmount = swap.amountOut;
        baseAsset = swap.assetOut;
      }

      if (!baseAssetSwapType) return markets;

      const market = markets[swap.marketId];
      if (market != null) {
        markets[swap.marketId] = {
          ...market,
          baseAssetIn: (baseAssetSwapType === "in"
            ? baseAssetAmount
            : new Decimal(0)
          ).plus(market.baseAssetIn),
          baseAssetOut: (baseAssetSwapType === "out"
            ? baseAssetAmount
            : new Decimal(0)
          ).plus(market.baseAssetOut),
        };
      } else {
        markets[swap.marketId] = {
          baseAsset: baseAsset,
          baseAssetIn:
            baseAssetSwapType === "in" ? baseAssetAmount : new Decimal(0),
          baseAssetOut:
            baseAssetSwapType === "out" ? baseAssetAmount : new Decimal(0),
        };
      }
      return markets;
    }, {});
    console.log(marketTotal);

    return { ...traders, [accountId]: marketTotal };
  }, {});

  console.log(tradersAggregatedByMarket);

  const rankings = [];
  return {
    props: {
      rankings,
      revalidate: 10 * 60, //10min
    },
  };
}

const Leaderboard: NextPage<{
  rankings: any[];
}> = ({ rankings }) => {
  return <div>Leaderboard</div>;
};

export default Leaderboard;
