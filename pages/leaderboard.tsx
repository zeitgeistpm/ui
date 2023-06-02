import { GraphQLClient } from "graphql-request";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { NextPage } from "next";
import {
  AssetId,
  getMarketIdOf,
  IOMarketOutcomeAssetId,
  mainnet,
  mainnetIndexer,
  parseAssetId,
  RpcContext,
  Sdk,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import { create, mainnetRpc } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";

type Trade = {
  marketId: number;
  // baseAsset: AssetId;
  amountIn: Decimal;
  amountOut: Decimal;
  assetIn: AssetId;
  assetOut: AssetId;
  type: "trade" | "redeem";
};

type Traders = {
  [key: string]: Trade[];
};

export async function getStaticProps() {
  const client = new GraphQLClient(graphQlEndpoint);
  // const sdk= await create(mainnet());
  const sdk = await create({
    provider: endpointOptions.map((e) => e.value),
    indexer: graphQlEndpoint,
    storage: ZeitgeistIpfs(),
  });

  const { historicalSwaps } = await sdk.indexer.historicalSwaps();
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
  const { historicalAccountBalances } =
    await sdk.indexer.historicalAccountBalances({
      where: { event_contains: "TokensRedeemed" },
    });

  console.log(historicalAccountBalances);
  historicalAccountBalances.forEach((redeem) => {
    const trades = tradersWithSwaps[redeem.accountId];

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
  });

  console.log(tradersWithSwaps);

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
