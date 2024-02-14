// run with the command  e.g `ts-node -s --transpile-only --esm scripts/mts/getSpotPrices.mts 65 --at 1944439`
import { Command } from "commander";
import { ZeitgeistIpfs, createRpcContext } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";

const program = new Command();

program
  .arguments("<marketId>")
  .option("--at <blockNumber>", "At block number")
  .action(async (_marketId, cmd) => {
    const marketId = Number(_marketId);
    const bn = cmd.at;
    getSpotPrices(marketId, bn);
  })
  .parse(process.argv);

async function getSdk() {
  return createRpcContext({
    provider: "wss://zeitgeist.api.onfinality.io/public-ws",
    storage: ZeitgeistIpfs(),
  });
}

function calcSpotPrice(
  tokenBalanceIn: Decimal | string | number,
  tokenWeightIn: Decimal | string | number,
  tokenBalanceOut: Decimal | string | number,
  tokenWeightOut: Decimal | string | number,
  swapFee: Decimal | string | number,
) {
  const numer = new Decimal(tokenBalanceIn).div(new Decimal(tokenWeightIn));
  const denom = new Decimal(tokenBalanceOut).div(new Decimal(tokenWeightOut));
  const ratio = numer.div(denom);
  const scale = new Decimal(1).div(new Decimal(1).sub(new Decimal(swapFee)));
  const spotPrice = ratio.mul(scale);
  return spotPrice;
}

async function getSpotPrices(marketId: number, block?: string) {
  const sdk = await getSdk();
  let { api } = sdk;

  let apiAt, blockHash;

  if (block != null) {
    blockHash = (await api.rpc.chain.getBlockHash(block)).toString();
    apiAt = await api.at(blockHash);
  } else {
    const { hash } = await api.rpc.chain.getHeader();
    blockHash = hash.toString();
    apiAt = await api.at(hash);
  }

  const market = (await apiAt.query.marketCommons.markets(marketId)).toJSON();
  const poolId = await apiAt.query.marketCommons.marketPool(marketId);
  const pool = (
    await apiAt.query.swaps.pools(poolId.toString())
  ).toJSON() as any;

  if (pool == null) {
    console.log("\\nNo pool, no prices. :P");
    return await sdk.api.disconnect();
  }

  //@ts-ignore
  if (market?.status === "Resolved") {
    console.log("Market is Resolved");
    return await sdk.api.disconnect();
  }

  const spotPrices = new Map<string, Decimal>();
  const weights: { assetId: string; len: any }[] = Object.entries(pool.weights)
    .filter((weight: any) => weight[0].toLowerCase() !== "ztg")
    .map((weight: any) => ({ assetId: weight[0], len: weight[1] }));

  const baseWeight = pool.weights["Ztg"];

  const assets = weights.map((weight) => JSON.parse(weight.assetId));

  const accountId = await sdk.api.rpc.swaps.poolAccountId(poolId.toString());

  const balances = await apiAt.query.tokens.accounts.multi(
    assets.map((assets) => [accountId.toString(), assets]),
  );
  const basePoolBalance = await apiAt.query.system.account(accountId);

  weights.forEach((weight, index) => {
    const spotPrice = calcSpotPrice(
      basePoolBalance.data.free.toString(),
      baseWeight,
      balances[index].free.toString(),
      weight.len,
      0,
    );

    spotPrices.set(weight.assetId, spotPrice);
  });
  await sdk.api.disconnect();
}
