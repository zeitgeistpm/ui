import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  CreateMarketParams,
  IOForeignAssetId,
  RpcContext,
  ZTG,
  isFullSdk,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import { StorageError } from "@zeitgeistpm/web3.storage";
import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import { checkMarketExists } from "lib/gql/markets";
import { NotificationType } from "lib/state/notifications";
import { isArray } from "lodash-es";
import { PollingTimeout, poll } from "@zeitgeistpm/avatara-util";

/**
 * Extract market ID from blockchain events
 */
export const extractMarketIdFromEvent = (events: any[]) => {
  const marketCreationEvent = events.find(
    (event) => event.event.index.toString() === "0x3903"
  );
  
  if (!marketCreationEvent) {
    throw new Error("Market creation event not found");
  }
  
  const marketData = marketCreationEvent.event.data[2] as any;
  return Number(marketData.marketId);
};

/**
 * Create a market on the blockchain
 */
export const createMarket = async (
  sdk: any,
  creationParams: CreateMarketParams<RpcContext>,
  feeAssetId?: any
) => {
  if (!isFullSdk(sdk)) {
    throw new Error("SDK is not in full mode");
  }

  const result = await sdk.model.markets.create(
    creationParams,
    IOForeignAssetId.is(feeAssetId) ? feeAssetId : undefined,
  );

  const marketId = extractMarketIdFromEvent(result.raw.events);
  
  return {
    marketId,
    result,
  };
};

/**
 * Generate combinatorial market categories from constituent markets
 */
export const generateCombinatorialCategories = (markets: FullMarketFragment[]) => {
  if (markets.length !== 2) {
    throw new Error("Currently only supports 2-market combinations");
  }

  const [market1, market2] = markets;
  const combinations: any[] = [];

  market1.categories?.forEach((cat1: any) => {
    market2.categories?.forEach((cat2: any) => {
      combinations.push({
        name: `${cat1.name} & ${cat2.name}`,
        ticker: `${cat1.ticker || cat1.name}_${cat2.ticker || cat2.name}`,
        metadata: {
          constituentMarkets: [market1.marketId, market2.marketId],
          constituentOutcomes: [cat1.name, cat2.name],
        },
      });
    });
  });

  return combinations;
};

/**
 * Deploy combinatorial pool using the signAndSend utility
 */
export const deployCombinatorialPool = async (
  sdk: any,
  signer: any,
  poolParams: {
    outcomeCount: number;
    marketIds: number[];
    amount: string;
    spotPrices: string[];
    swapFee: string;
  }
) => {
  if (!isRpcSdk(sdk)) {
    throw new Error("SDK is not in RPC mode");
  }

  const deployPoolTx = sdk.api.tx.neoSwaps.deployCombinatorialPool(
    poolParams.outcomeCount,
    poolParams.marketIds,
    poolParams.amount,
    poolParams.spotPrices,
    poolParams.swapFee,
    { total: 16, consumeAll: true }, // Default fuel
  );

  // Import the signAndSend utility function
  const { signAndSend } = await import("lib/util/tx");
  
  // Use the utility function which handles signer types correctly
  await signAndSend(deployPoolTx, signer);
};

/**
 * Format liquidity parameters for combinatorial pool
 */
export const formatPoolParams = (
  liquidityAmount: string,
  spotPrices: string[],
  swapFee: string
) => {
  const liquidityNum = parseFloat(liquidityAmount || "0");
  const safeLiquidity = isNaN(liquidityNum) ? 0 : Math.max(0, liquidityNum);
  const amount = new Decimal(safeLiquidity).mul(ZTG).toFixed(0);
  
  const spotPricesFormatted = spotPrices.map((price) => {
    const numPrice = parseFloat(price || "0");
    const safePrice = isNaN(numPrice) ? 0 : Math.max(0, numPrice);
    return new Decimal(safePrice).div(100).mul(ZTG).toFixed(0);
  });
  
  const swapFeeFormatted = new Decimal(swapFee).div(100).mul(ZTG).toFixed(0);

  return {
    amount,
    spotPrices: spotPricesFormatted,
    swapFee: swapFeeFormatted,
  };
};

/**
 * Wait for market to be indexed by the GraphQL indexer
 */
export const waitForMarketIndexing = async (
  sdk: any,
  marketId: number,
  timeoutMs: number = 6000
) => {
  const indexedStatus = await poll(
    async () => {
      return checkMarketExists(sdk.indexer.client as unknown as GraphQLClient, marketId);
    },
    {
      intervall: 1000,
      timeout: timeoutMs,
    },
  );

  return indexedStatus !== PollingTimeout;
};

/**
 * Standard notification messages for market creation flow
 */
export const marketCreationNotifications = {
  creating: "Creating combinatorial market...",
  created: "Market created! Now deploying pool...",
  poolDeployed: "Pool deployed successfully!",
  complete: "Market creation complete! Awaiting indexer.",
  indexed: "Market has been created and indexed! Redirecting to market page.",
  timeout: "Market created but indexing timed out. You can find it in your portfolio.",
};

/**
 * Handle standard market creation errors
 */
export const handleMarketCreationError = (error: any): { type: NotificationType; message: string } => {
  let type: NotificationType = "Error";
  let errorMessage = "Unknown error occurred.";

  if (StorageError.is(error)) {
    errorMessage = error?.message ?? "Metadata storage failed.";
  }

  if (isArray(error?.docs)) {
    errorMessage = error.docs[0];
  }

  if (error?.message === "Cancelled") {
    type = "Info";
    errorMessage = "Transaction cancelled";
  }

  return { type, message: errorMessage };
};