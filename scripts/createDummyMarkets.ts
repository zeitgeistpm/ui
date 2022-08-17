import SDK, { util } from "@zeitgeistpm/sdk";
import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { waitReady } from "@polkadot/wasm-crypto";
import { Command, Option } from "commander";
import { KeyringPairOrExtSigner, MarketPeriod } from "@zeitgeistpm/sdk/dist/types";
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
    "ws://127.0.0.1:9944",
  )
  .option(
    "-nm, --num-markets [numMarkets]",
    "number of markets to create",
    "10",
  )
  .option(
    "-o, --offset [offset]",
    "markets beginings will be offset time units apart",
    "100",
  )
  .option("-l, --length [number]", "market lenght in `block`s or `timestamp`s depending on unit option.", "86400000")
  .addOption(
    new Option(
      "-u, --unit [type]",
      "use `block` or `timestamp` for market period unit. timestamps will be calculated from current time in ms.",
    ).default("timestamp").choices(["block", "timestamp"]),
  )
  .option(
    "-no, --num-outcomes [numOutcomes]",
    "number of outcomes for each market, ztg excluded",
    "2",
  )
  .option(
    "-p, --deploy-pool",
    "deploy default liquidity pool for each market",
    false,
  );
program.parse(process.argv);

console.log(program.opts());
const { endpoint, numMarkets, offset, numOutcomes, deployPool, unit, length } =
  program.opts();

const createCategoricalMarket = async (
  sdk: SDK,
  num: number,
  start: number,
  end: number,
  unit: "block" | "timestamp",
  signer: KeyringPairOrExtSigner,
) => {
  sdk =
    sdk ||
    (await SDK.initialize(endpoint, {
      ipfsClientUrl: "http://localhost:5001",
    }));

  const slug = `${num}-end${end}`;
  let period: MarketPeriod;
  if (unit === "block") {
    period = {
      block: [start, end],
    };
  } else {
    period = {
      timestamp: [start, end],
    };
  }

  const metadata = {
    description: "...",
    slug,
    question: `q.${slug}`,
    categories: [...new Array(Number(numOutcomes))].map((_, idx) => {
      return {
        name: `C0${idx}.${slug}`,
        ticker: `${num}.T${idx}`,
        color: randomHexColor(),
      };
    }),
  };

  const id = await sdk.models.createMarket({
    signer,
    oracle: signer.address,
    period,
    metadata,
    creationType: "Permissionless",
    marketType: { Categorical: numOutcomes },
    mdm: { authorized: signer.address },
    scoringRule: "CPMM",
    callbackOrPaymentInfo: false,
  });

  console.log(metadata);

  return +id;
};

(async () => {
  await waitReady();

  const sdk = await SDK.initialize(endpoint, {
    ipfsClientUrl: "http://localhost:5001",
  });
  const signer: KeyringPairOrExtSigner = util.signerFromSeed(seed);
  const len = Number(length);
  let end: number | undefined;
  let id = +(await sdk.api.query.marketCommons.marketCounter());
  if (id > 0) {
    id = id + 1;
  }
  const periodBlock = unit === "block";
  let start: number = -1;
  let off = 0;
  for (const _ of [...new Array(Number(numMarkets))]) {
    if (start !== -1) {
      start = start + off;
    } else {
      if (unit === "block") {
        start = Number((await sdk.api.query.system.number()).toString()) + off;
      } else {
        start = new Date().valueOf() + 10000 + off;
      }
    }
    off = off + Number(offset);
    end = start + len;
    const marketId = await createCategoricalMarket(
      sdk,
      id,
      start,
      end,
      periodBlock ? "block" : "timestamp",
      signer,
    );

    if (deployPool) {
      let market = await sdk.models.fetchMarketData(marketId);

      await market.buyCompleteSet(signer, 100 * ZTG);

      const baseWeight = (1 / numOutcomes) * 10 * ZTG;
      let weights = [];

      for (let i = 0; i < numOutcomes; i++) {
        weights.push(Math.floor(baseWeight).toString());
      }

      await market.deploySwapPool(signer, "0", "1000000000000", weights);

      market = await sdk.models.fetchMarketData(marketId);

      const pool = (await market.getPool()) as Swap;
      const poolAccount = await pool.accountId();

      console.log(
        `\nDeployed pool with account address ${poolAccount.toString()}\n`,
      );
    }

    id = marketId + 1;
  }
  sdk.api.disconnect();
})();
