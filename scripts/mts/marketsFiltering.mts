// run with `ts-node -s --transpile-only --esm scripts/mts/marketsFiltering.mts`
import {
  Context,
  create$,
  Sdk,
  createStorage,
  isIndexedSdk,
  isRpcSdk,
} from "@zeitgeistpm/sdk-next";
import { IPFS } from "@zeitgeistpm/web3.storage";

const LocalIPFS = () => {
  return createStorage(
    IPFS.storage({ node: { url: "http://localhost:5001" } }),
  );
};

const getSdkObservable = () => {
  return create$({
    provider: "ws://localhost:9944",
    indexer: "http://localhost:4350/graphql",
    storage: LocalIPFS(),
  });
};

const marketsFiltering = async (sdk: Sdk<Context>) => {
  const markets = await sdk.model.markets.list({
    where: {
      pool_isNull: true,
    },
  });
  console.log(markets);
};

(async () => {
  const sdkObs = getSdkObservable();
  sdkObs.subscribe((sdk) => {
    if (isIndexedSdk(sdk) && !isRpcSdk(sdk)) {
      marketsFiltering(sdk);
    }
  });
})();
