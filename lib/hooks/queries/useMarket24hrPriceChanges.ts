import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useEffect, useState } from "react";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";
import { useMarketSpotPrices } from "./useMarketSpotPrices";
import { useChainTime } from "lib/state/chaintime";

export const market24hrPriceChangesKey = "market-24hr-price-changes";

const getBlock24hrsAgo = (blockTimeSec: number, currentBlock: number) => {
  const daySeconds = 24 * 60 * 60;
  const dayBlocks = daySeconds / blockTimeSec;

  return currentBlock - dayBlocks;
};

export const useMarket24hrPriceChanges = (
  marketId: number,
  virtualMarket?: FullMarketFragment,
) => {
  const [sdk, id] = useSdkv2();
  const [debouncedBlockNumber, setDebouncedBlockNumber] = useState<number>();

  const chainTime = useChainTime();
  const { data: constants } = useChainConstants();

  useEffect(() => {
    if (!chainTime) return;

    if (
      !debouncedBlockNumber ||
      chainTime?.block - debouncedBlockNumber > 100
    ) {
      setDebouncedBlockNumber(chainTime?.block);
    }
  }, [chainTime?.block]);

  const block24hrsAgo =
    constants?.blockTimeSec &&
    debouncedBlockNumber &&
    getBlock24hrsAgo(constants?.blockTimeSec, debouncedBlockNumber);

  const { data: pricesNow } = useMarketSpotPrices(marketId, undefined, virtualMarket);
  const { data: prices24hrsAgo } = useMarketSpotPrices(marketId, block24hrsAgo, virtualMarket);

  const enabled =
    isRpcSdk(sdk) &&
    marketId != null &&
    !!block24hrsAgo &&
    !!pricesNow &&
    !!prices24hrsAgo;

  const query = useQuery(
    [id, market24hrPriceChangesKey, marketId, virtualMarket?.marketId],
    async () => {
      if (!enabled) return null;
      const priceChanges = new Map<number, number>();

      for (const [key, nowPrice] of pricesNow.entries()) {
        const pastPrice = prices24hrsAgo.get(key);

        if (pastPrice != null && nowPrice != null) {
          const priceDiff = nowPrice.minus(pastPrice);
          const priceChange = priceDiff.div(pastPrice);

          priceChanges.set(
            key,
            priceChange.isNaN()
              ? 0
              : Math.round(priceChange.mul(100).toNumber()),
          );
        } else {
          priceChanges.set(key, 0);
        }
      }

      return priceChanges;
    },
    {
      enabled: enabled,
    },
  );

  return query;
};
