import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import Decimal from "decimal.js";
import { sanity } from "lib/cms/sanity/index";
import groq from "groq";
import https from "https";

// GraphQL query to find markets and combinatorial pools tagged with OpenGov/referendum
const referendumMarketsQuery = gql`
  query ReferendumMarkets($tags: [String!]!) {
    markets(
      where: {
        tags_containsAny: $tags
        status_in: [Active, Resolved, Reported]
      }
      orderBy: marketId_DESC
      limit: 20
    ) {
      marketId
      question
      description
      status
      tags
      categories {
        name
        ticker
      }
      outcomeAssets
      pool {
        poolId
      }
      neoPool {
        poolId
        liquidityParameter
        volume
      }
      resolvedOutcome
      report {
        outcome {
          categorical
        }
      }
    }
  }
`;

// Query to find combinatorial neoPools that combine the tagged markets
const combinatorialPoolsQuery = gql`
  query CombinatorialPools($marketIds: [Int!]!) {
    neoPools(
      where: {
        isMultiMarket_eq: true
        marketIds_containsAll: $marketIds
      }
    ) {
      poolId
      marketIds
      marketId
      isMultiMarket
      volume
      totalStake
      swapFee
      liquidityParameter
      parentCollectionIds
      createdAt
      collateral
      account {
        accountId
      }
    }
  }
`;

// Query to get pool reserves for spot price calculation
const poolReservesQuery = gql`
  query PoolReserves($poolId: Int!) {
    assets(where: { poolId_eq: $poolId }, orderBy: id_ASC) {
      assetId
      amountInPool
    }
  }
`;

// CMS query to find markets linked to referendum
const cmsReferendumQuery = groq`
  *[_type == "marketMetadata" && referendumRef.referendumIndex == $refId] {
    "marketId": market.marketId,
    question,
    referendumRef
  }
`;

// Helper: Calculate spot price using LMSR formula
// Based on lib/util/amm2.ts calculateSpotPrice
// Formula: e^(-reserve/liquidity)
const calculateSpotPrice = (reserve: Decimal, liquidity: Decimal): Decimal => {
  if (liquidity.isZero()) return new Decimal(0);
  const exponent = new Decimal(0).minus(reserve).div(liquidity);
  return new Decimal(Math.exp(exponent.toNumber()));
};

// Helper: Calculate probabilities from spot prices
const calculateProbabilities = (spotPrices: Decimal[]): number[] => {
  const totalPrice = spotPrices.reduce((sum, price) => sum.plus(price), new Decimal(0));
  if (totalPrice.isZero()) {
    // Uniform distribution if no prices
    return spotPrices.map(() => 1 / spotPrices.length);
  }
  return spotPrices.map(price => price.div(totalPrice).toNumber());
};

export type CombinatorialOutcome = {
  combination: string;
  probability: number;
  description: string;
};

export type ReferendumSignalResponse = {
  referendumId: number;
  chain: "polkadot" | "kusama";
  base_markets: Array<{
    marketId: number;
    question: string;
    status: string;
    volume: string;
    market_url: string;
  }>;
  combinatorial_market?: {
    poolId: number;
    market_1: { marketId: number; question: string };
    market_2: { marketId: number; question: string };
    outcomes: CombinatorialOutcome[];
    volume: string;
    liquidity: string;
    pool_url: string;
  };
  futarchy_signal?: {
    welfare_metric: string;
    recommendation: string; // Highest probability outcome (e.g., "No & No")
    confidence: number;
    reasoning: string;
  };
  widget?: {
    iframe_url: string;
    iframe_embed_code: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReferendumSignalResponse | { error: string }>
) {
  // Cache configuration
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow Polkassembly to access
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { refId } = req.query;
  const referendumId = parseInt(Array.isArray(refId) ? refId[0] : refId || "");

  if (isNaN(referendumId)) {
    return res.status(400).json({ error: "Invalid referendum ID" });
  }

  try {
    // Initialize GraphQL client for Subsquid
    // Use BSR endpoint for better SSL compatibility
    const subsquidUrl = process.env.NEXT_PUBLIC_SUBSQUID_URL ||
      "https://processor.bsr.zeitgeist.pm/graphql";

    // Create HTTPS agent for SSL handling
    // Development: disables SSL verification (allows self-signed certs)
    // Production: enables SSL verification (secure, validates certificates)
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV !== 'development'
    });

    const graphqlClient = new GraphQLClient(subsquidUrl, {
      // @ts-ignore - graphql-request doesn't have proper types for fetch options
      agent: httpsAgent,
    });

    // Query markets tagged with "OpenGov" - this is the only tag used
    const tags = ["OpenGov"];

    // Fetch markets and CMS data
    const [graphqlData, cmsData] = await Promise.all([
      graphqlClient.request<{ markets: any[] }>(
        referendumMarketsQuery,
        { tags }
      ),
      sanity.fetch(cmsReferendumQuery, { refId: referendumId }).catch(() => [])
    ]);

    // Filter markets by CMS referendum index
    let allMarkets = graphqlData.markets || [];

    // If CMS data exists for this referendum, filter to only those markets
    if (cmsData && cmsData.length > 0) {
      const cmsMarketIds = new Set(cmsData.map((m: any) => m.marketId));
      allMarkets = allMarkets.filter(m => cmsMarketIds.has(m.marketId));
    }
    // Otherwise, return empty since we can't identify which OpenGov markets belong to this referendum
    else {
      allMarkets = [];
    }

    if (allMarkets.length === 0) {
      return res.status(404).json({
        error: `No prediction markets found for referendum #${referendumId}`
      });
    }

    const chain = cmsData?.[0]?.referendumRef?.chain || "polkadot";
    const marketIds = allMarkets.map(m => m.marketId);

    // Fetch combinatorial pools that combine these markets
    const poolsData = await graphqlClient.request<{ neoPools: any[] }>(
      combinatorialPoolsQuery,
      { marketIds }
    );

    const combinatorialPools = poolsData.neoPools || [];

    // Transform base markets
    const baseMarkets = allMarkets.map(market => {
      // Volume only exists on neoPool, not old Pool type
      const volume = market.neoPool?.volume || "0";
      const volumeDec = new Decimal(volume).div(1e10);

      return {
        marketId: market.marketId,
        question: market.question,
        status: market.status,
        volume: volumeDec.toString(),
        market_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.zeitgeist.pm'}/markets/${market.marketId}`,
      };
    });

    // Process combinatorial market if exists
    let combinatorialMarket;
    let futarchySignal;

    if (combinatorialPools.length > 0) {
      const pool = combinatorialPools[0]; // Take first combinatorial pool
      const [marketId1, marketId2] = pool.marketIds;

      const market1 = allMarkets.find(m => m.marketId === marketId1);
      const market2 = allMarkets.find(m => m.marketId === marketId2);

      if (market1 && market2) {
        const poolVolume = new Decimal(pool.volume || "0").div(1e10);
        const poolLiquidity = new Decimal(pool.liquidityParameter || "0").div(1e10);

        // Fetch pool reserves for spot price calculation
        const reservesData = await graphqlClient.request<{ assets: Array<{ assetId: string; amountInPool: string }> }>(
          poolReservesQuery,
          { poolId: pool.poolId }
        );

        // Calculate spot prices from reserves
        const spotPrices: Decimal[] = [];
        reservesData.assets.forEach((asset) => {
          const reserve = new Decimal(asset.amountInPool || "0").div(1e10);
          const spotPrice = calculateSpotPrice(reserve, poolLiquidity);
          spotPrices.push(spotPrice);
        });

        // Calculate probabilities from spot prices
        const probabilities = calculateProbabilities(spotPrices);

        // CONVENTION: Market ordering assumption
        // marketIds[0] (market1) = Proposal outcome (Pass/Reject)
        // marketIds[1] (market2) = Welfare metric (Good/Bad outcome)
        //
        // When creating combinatorial pools, ensure the first market in marketIds
        // is always the proposal market, and the second is the welfare metric.
        // This allows futarchy signal calculation to work correctly.
        //
        // TODO: Consider adding explicit welfare metric marking in CMS for robustness
        const cat1 = market1.categories
        const cat2 = market2.categories

        const outcomes: CombinatorialOutcome[] = [];
        let outcomeIndex = 0;

        cat1.forEach((c1: any) => {
          cat2.forEach((c2: any) => {
            outcomes.push({
              combination: `${c1.name || c1.ticker} & ${c2.name || c2.ticker}`,
              probability: probabilities[outcomeIndex],
              description: `${market1.question} → ${c1.name || c1.ticker} AND ${market2.question} → ${c2.name || c2.ticker}`
            });
            outcomeIndex++;
          });
        });

        combinatorialMarket = {
          poolId: pool.poolId,
          market_1: { marketId: market1.marketId, question: market1.question },
          market_2: { marketId: market2.marketId, question: market2.question },
          outcomes,
          volume: poolVolume.toString(),
          liquidity: poolLiquidity.toString(),
          pool_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.zeitgeist.pm'}/multi-market/${pool.poolId}`,
        };

        // Find highest probability outcome for market prediction
        const highestOutcome = outcomes.reduce((max, outcome) =>
          outcome.probability > max.probability ? outcome : max
        , outcomes[0]);

        // Calculate confidence as the probability of the highest outcome
        const confidence = highestOutcome.probability;

        // Generate reasoning based on the outcome probabilities
        const reasoning = `Based on current market predictions, "${highestOutcome.combination}" has the highest probability at ${Math.round(confidence * 100)}%. This suggests the market believes this is the most likely outcome if the proposal passes.`;

        futarchySignal = {
          welfare_metric: market2.question,
          recommendation: highestOutcome.combination,
          confidence,
          reasoning,
        };
      }
    }

    // Generate widget embed code
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.zeitgeist.pm';
    const widgetUrl = `${baseUrl}/referendum-signal/widget/${referendumId}`;
    const iframeEmbedCode = `<iframe src="${widgetUrl}" width="100%" height="400" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`;

    const response: ReferendumSignalResponse = {
      referendumId,
      chain: chain as "polkadot" | "kusama",
      base_markets: baseMarkets,
      combinatorial_market: combinatorialMarket,
      futarchy_signal: futarchySignal,
      widget: {
        iframe_url: widgetUrl,
        iframe_embed_code: iframeEmbedCode,
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching referendum signal:", error);
    return res.status(500).json({
      error: "Failed to fetch referendum market data"
    });
  }
}
