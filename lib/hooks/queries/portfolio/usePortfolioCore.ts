import { useAccountTokenPositions } from "../useAccountTokenPositions";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import {
  IOMarketOutcomeAssetId,
  IOPoolShareAssetId,
  IOZtgAssetId,
  IOForeignAssetId,
  getMarketIdOf,
} from "@zeitgeistpm/sdk";
import { isCombinatorialToken } from "lib/types/combinatorial";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useMemo } from "react";

export type CorePosition = {
  assetId: any;
  assetType: 'market' | 'pool-share' | 'combinatorial' | 'ztg' | 'foreign' | 'unknown';
  marketId?: number;
  poolId?: number;
  balance: string;
  assetIdString: string;
};

/**
 * Lightweight hook that only fetches basic token positions without additional processing.
 * This is the foundation for other portfolio hooks.
 */
export const usePortfolioCore = (address?: string) => {
  const rawPositions = useAccountTokenPositions(address);

  const positions = useMemo<CorePosition[] | undefined>(() => {
    if (!rawPositions.data) return undefined;

    return rawPositions.data.map((position) => {
      const assetId = parseAssetIdStringWithCombinatorial(position.assetId) as any;

      let assetType: CorePosition['assetType'] = 'unknown';
      let marketId: number | undefined;
      let poolId: number | undefined;

      if (IOZtgAssetId.is(assetId)) {
        assetType = 'ztg';
      } else if (IOForeignAssetId.is(assetId)) {
        assetType = 'foreign';
      } else if (IOMarketOutcomeAssetId.is(assetId)) {
        assetType = 'market';
        marketId = getMarketIdOf(assetId);
      } else if (IOPoolShareAssetId.is(assetId)) {
        assetType = 'pool-share';
        poolId = assetId.PoolShare;
      } else if (isCombinatorialToken(assetId)) {
        assetType = 'combinatorial';
      }

      return {
        assetId,
        assetType,
        marketId,
        poolId,
        balance: position.balance,
        assetIdString: position.assetId,
      };
    });
  }, [rawPositions.data]);

  return {
    data: positions,
    isLoading: rawPositions.isLoading,
    error: rawPositions.error,
  };
};

/**
 * Filter positions by type for targeted data fetching
 */
export const useFilteredPositions = (
  address?: string,
  types?: CorePosition['assetType'][],
) => {
  const { data: positions, isLoading, error } = usePortfolioCore(address);

  const filtered = useMemo(() => {
    if (!positions || !types) return positions;
    return positions.filter((p) => types.includes(p.assetType));
  }, [positions, types]);

  return {
    data: filtered,
    isLoading,
    error,
  };
};