import { useQuery } from "@tanstack/react-query";
import { Context, isRpcSdk, Market } from "@zeitgeistpm/sdk-next";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import { useSdkv2 } from "../useSdkv2";
import { useChainTimeNow } from "./useChainTime";
import { marketsRootQuery } from "./useMarket";

export const marketStageRootKey = "market-stage";

export type MarketStageQuery = {
  market: Market<Context>;
  now?: ChainTime;
};

/**
 * Get the current stage of a market.
 *
 * @param market Market<Context>
 * @returns useQuery<MarketStage, unknown, MarketStage>
 */
export const useMarketStage = (market?: Market<Context>) => {
  const [sdk, id] = useSdkv2();

  const { data: now } = useChainTimeNow();

  return useQuery(
    [id, marketsRootQuery, market?.marketId, marketStageRootKey],
    async () => {
      if (sdk && isRpcSdk(sdk) && market) {
        return await sdk.model.markets.getStage(market, now);
      }
      return null;
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && market && now),
    },
  );
};
