import { FullMarketFragment, MarketStatus } from "@zeitgeistpm/indexer";
import { ComboPoolData, MarketBasicData } from "../gql/combo-pools";

// Utility function to create a virtual market object for combo pools
// This is used by both the combo pool detail page and the market card
export const createVirtualComboMarket = (
  poolId: number,
  poolData: any, // AMM2 pool data
  associatedMarkets: MarketBasicData[],
  accountId?: string,
): FullMarketFragment => {
  // Get combined question from associated markets
  const combinedQuestion = associatedMarkets.length > 0
    ? associatedMarkets.map((m, index) => 
        index === associatedMarkets.length - 1 
          ? m.question 
          : m.question + " &"
      ).join("\n")
    : `Pool ${poolId}`;

  // Combine categories from associated markets to create outcome combinations
  const outcomeCombinations: any[] = [];
  if (associatedMarkets.length >= 2) {
    const market1 = associatedMarkets[0];
    const market2 = associatedMarkets[1];
    
    market1.categories?.forEach((cat1) => {
      market2.categories?.forEach((cat2) => {
        outcomeCombinations.push({
          name: `${cat1.name} & ${cat2.name}`,
          color: cat1.color || cat2.color || '#E5E7EB',
        });
      });
    });
  }

  // Get combined period from source markets (earliest start, earliest end)
  const getCombinedMarketPeriod = () => {
    let earliestStart: string | null = null;
    let earliestEnd: string | null = null;

    associatedMarkets.forEach((market) => {
      if (market.period) {
        const marketStart = market.period.start;
        const marketEnd = market.period.end;

        if (marketStart && marketEnd) {
          // Find earliest start
          if (!earliestStart || parseInt(marketStart) < parseInt(earliestStart)) {
            earliestStart = marketStart;
          }

          // Find earliest end (combo pool closes when first underlying market closes)
          if (!earliestEnd || parseInt(marketEnd) < parseInt(earliestEnd)) {
            earliestEnd = marketEnd;
          }
        }
      }
    });

    const start = earliestStart || "0";
    const end = earliestEnd || "1000000000000";

    return {
      block: [start, end],
      start,
      end,
    };
  };

  // Determine combo pool status based on source markets
  const getCombinedMarketStatus = (): MarketStatus => {
    // If any source market is not Active, combo pool should be Closed
    const hasInactiveMarket = associatedMarkets.some(market => market.status !== "Active");
    return hasInactiveMarket ? MarketStatus.Closed : MarketStatus.Active;
  };

  // Get base asset from first market
  const baseAsset = associatedMarkets[0]?.baseAsset || "Ztg";

  return {
    marketId: poolId,
    question: combinedQuestion,
    description: `Combinatorial market combining: ${associatedMarkets.map(m => m.question).join(' and ')}`,
    status: getCombinedMarketStatus(),
    oracle: accountId || associatedMarkets[0]?.oracle || "",
    categories: outcomeCombinations,
    baseAsset,
    outcomeAssets: poolData?.assetIds?.map((asset: any, index: number) => {
      // For combo pools, use the actual combinatorial token IDs from the pool
      if (typeof asset === 'object' && 'CombinatorialToken' in asset) {
        return asset.CombinatorialToken;
      }
      return `${poolId}-${index}`;
    }) || outcomeCombinations.map((_, index) => `${poolId}-${index}`),
    pool: null,
    neoPool: {
      ...poolData,
      totalStake: poolData?.liquidity?.toString(),
      totalShares: poolData?.totalShares?.toString(),
      liquidityParameter: poolData?.liquidity?.toString(),
      reserves: poolData?.reserves ? Object.fromEntries(poolData.reserves) : {},
    },
    slug: `combo-${poolId}`,
    __typename: "Market" as const,
    creation: "Proposed" as const,
    creator: accountId || associatedMarkets[0]?.creator || "",
    earlyClose: null,
    disputeMechanism: "Authorized" as const,
    hasValidMetaCategories: true,
    img: null,
    marketType: { categorical: null, scalar: null },
    period: getCombinedMarketPeriod(),
    deadlines: {
      gracePeriod: "0",
      oracleDuration: "0", 
      disputeDuration: "0",
    },
    resolvedOutcome: null,
    scalarType: null,
    tags: [],
    volume: "0",
    liquidity: poolData?.liquidity,
    report: null,
    disputes: [],
    rejectReason: null,
  } as unknown as FullMarketFragment;
};