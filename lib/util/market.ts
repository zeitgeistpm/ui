import { Asset } from "@zeitgeistpm/types/dist/interfaces/index";
import { FilterOptions, MarketStatus } from "lib/types";
interface BondPrices {
  advisedCost: number;
  permissionlessCost: number;
}

export const calculateMarketCost = (
  prices: BondPrices,
  advised: boolean,
  poolAmounts?: number[],
): number => {
  let cost = 0;

  if (advised === true) {
    cost = prices.advisedCost;
  } else if (advised === false) {
    cost = prices.permissionlessCost;
  }

  if (poolAmounts) {
    cost += calculatePoolCost(poolAmounts);
  }

  return cost;
};

export const calculatePoolCost = (poolAmounts?: number[]) => {
  return poolAmounts[0] * 2;
};

export const activeStatusesFromFilters = (
  filters: FilterOptions,
): MarketStatus[] => {
  const statuses = Object.keys(filters).filter(
    (k) =>
      !["oracle", "creator", "hasAssets", "HasLiquidityPool"].includes(k) &&
      filters[k] === true,
  );
  return statuses as MarketStatus[];
};

export const getAssetIds = (asset: Asset) => {
  if (asset.isCategoricalOutcome) {
    return {
      marketId: asset.asCategoricalOutcome[0],
      assetId: asset.asCategoricalOutcome[1].toNumber(),
    };
  } else if (asset.isScalarOutcome) {
    return {
      marketId: asset.asScalarOutcome[0],
      assetId: asset.asScalarOutcome[1].isShort ? 0 : 1,
    };
  }
};

export const get24HrPriceChange = (
  prices: {
    newPrice: number;
    timestamp: string;
  }[],
): number => {
  const price24HrAgo = getPrice24HrAgo(prices);
  const currentPrice = prices[0]?.newPrice;

  return price24HrAgo != null && currentPrice != null
    ? Math.round((currentPrice / price24HrAgo - 1) * 100)
    : 0;
};

export const getPrice24HrAgo = (
  prices: {
    newPrice: number;
    timestamp: string;
  }[],
): number => {
  const daySeconds = 86400;
  const oneDayAgoTimestamp = new Date().getTime() - daySeconds * 1000;

  for (let i = 1; i < prices.length; i++) {
    const previousTime = new Date(prices[i - 1].timestamp).getTime();
    const currentTime = new Date(prices[i].timestamp).getTime();

    if (
      Math.abs(previousTime - oneDayAgoTimestamp) <
      Math.abs(currentTime - oneDayAgoTimestamp)
    ) {
      return prices[i - 1].newPrice;
    }
  }

  return prices[1]?.newPrice;
};
