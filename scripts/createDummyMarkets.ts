import SDK, { util } from "@zeitgeistpm/sdk";
import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { Command } from "commander";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import dotenv from "dotenv";
import { resolve } from "path";
import { ZTG } from "../lib/constants";
import { randomHexColor } from "../lib/util";

const program = new Command();

dotenv.config({ path: resolve(__dirname, "..", ".env.local") });
const seed = (process.env.NEXT_PUBLIC_TESTING_SEED as string).trim();

program
  .option(
    "-e, --endpoint [endpoint]",
    "node rpc endpoint",
    "ws://127.0.0.1:9944"
  )
  .option(
    "-l, --market-length [marketLength]",
    "market length in blocks",
    "2000"
  )
  .option(
    "-nm, --num-markets [numMarkets]",
    "number of markets to create",
    "10"
  )
  .option(
    "-o, --offset [offset]",
    "markets will be `offset` blocks from apart from each other",
    "100"
  )
  .option(
    "-no, --num-outcomes [numOutcomes]",
    "number of outcomes for each market, ztg excluded",
    "2"
  )
  .option(
    "-p, --deploy-pool",
    "deploy default liquidity pool for each market",
    false
  );
program.parse(process.argv);

console.log(program.opts());
const { endpoint, marketLength, numMarkets, offset, numOutcomes, deployPool } =
  program.opts();
console.log(
  endpoint,
  marketLength,
  numMarkets,
  offset,
  numOutcomes,
  deployPool
);

const createCategoricalMarket = async (
  sdk: SDK,
  num: number,
  startBlock: number,
  endBlock: number,
  signer: KeyringPairOrExtSigner
) => {
  sdk = sdk || (await SDK.initialize(endpoint, { ipfsClientUrl: "http://localhost:5001" }));

  const slug = `${num}-end${endBlock}`;
  const period = {
    block: [startBlock, endBlock]
  };

  const metadata = {
    description: "...",
    slug,
    question: `q.${slug}`,
    categories: [...new Array(Number(numOutcomes))].map((_, idx) => {
      return {
        name: `C0${idx}.${slug}`,
        ticker: `${num}.T${idx}`,
        color: randomHexColor()
      };
    })
  };

  const id = await sdk.models.createMarket({
    signer,
    oracle: signer.address,
    period,
    metadata,
    creationType: "Permissionless",
    marketType: { Categorical: numOutcomes },
    mdm: { Authorized: signer.address as unknown as number },
    scoringRule: "CPMM",
    callbackOrPaymentInfo: false
  });

  console.log(metadata);

  return +id;
};

(async () => {
  const sdk = await SDK.initialize(endpoint, { ipfsClientUrl: "http://localhost:5001" });
  const signer: KeyringPairOrExtSigner = util.signerFromSeed(seed);
  let end: number | undefined;
  let id = +(await sdk.api.query.marketCommons.marketCounter());
  if (id > 0) {
    id = id + 1;
  }
  for (const _ of [...new Array(Number(numMarkets))]) {
    const start = Number((await sdk.api.query.system.number()).toString());
    end = (end ?? start) + Number(marketLength);
    const marketId = await createCategoricalMarket(sdk, id, start, end, signer);

    if (deployPool) {
      let market = await sdk.models.fetchMarketData(marketId);

      await market.buyCompleteSet(signer, 100 * ZTG);

      const baseWeight = (1 / numOutcomes) * 10 * ZTG;
      let weights = [];

      for (let i = 0; i < numOutcomes; i++) {
        weights.push(Math.floor(baseWeight).toString());
      }

      console.log("weights", weights);

      await market.deploySwapPool(signer, "1000000000000", weights);

      market = await sdk.models.fetchMarketData(marketId);

      const pool = (await market.getPool()) as Swap;
      const poolAccount = await pool.accountId();

      console.log(
        `\nDeployed pool with account address ${poolAccount.toString()}\n`
      );
    }

    id = marketId + 1;
  }
  sdk.api.disconnect();
})();
