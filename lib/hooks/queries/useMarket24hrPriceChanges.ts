import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useStore } from "lib/stores/Store";
import { useEffect, useState } from "react";
import { useSdkv2 } from "../useSdkv2";
import { useMarketSpotPrices } from "./useMarketSpotPrices";

export const market24hrPriceChangesKey = Symbol();

const getBlock24hrsAgo = (blockTimeSec: number, currentBlock: number) => {
  const daySeconds = 24 * 60 * 60;
  const dayBlocks = daySeconds / blockTimeSec;

  return currentBlock - dayBlocks;
};

export const useMarket24hrPriceChanges = (marketId: number) => {
  const [sdk, id] = useSdkv2();
  const [debouncedBlockNumber, setDebouncedBlockNumber] = useState<number>();

  const { config, blockNumber } = useStore();

  useEffect(() => {
    if (!blockNumber) return;

    if (
      !debouncedBlockNumber ||
      blockNumber.toNumber() - debouncedBlockNumber > 100
    ) {
      setDebouncedBlockNumber(blockNumber.toNumber());
    }
  }, [blockNumber]);

  const block24hrsAgo =
    config?.blockTimeSec && debouncedBlockNumber
      ? getBlock24hrsAgo(config.blockTimeSec, debouncedBlockNumber)
      : null;

  const { data: pricesNow } = useMarketSpotPrices(marketId);
  const { data: prices24hrsAgo } = useMarketSpotPrices(marketId, block24hrsAgo);

  const query = useQuery(
    [id, market24hrPriceChangesKey],
    async () => {
      if (isRpcSdk(sdk)) {
        console.log("recalc");

        const priceChanges = new Map<number, number>();

        for (const [key, nowPrice] of pricesNow.entries()) {
          const pastPrice = prices24hrsAgo.get(key);

          if (pastPrice != null && nowPrice != null) {
            const priceDiff = nowPrice.minus(pastPrice);
            const priceChange = priceDiff.div(pastPrice);
            priceChanges.set(key, Math.round(priceChange.mul(100).toNumber()));
          }
        }

        return priceChanges;
      }
    },
    {
      enabled: Boolean(
        sdk &&
          isRpcSdk(sdk) &&
          marketId != null &&
          block24hrsAgo &&
          pricesNow &&
          prices24hrsAgo,
      ),
    },
  );

  return query;
};
