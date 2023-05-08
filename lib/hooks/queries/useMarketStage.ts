import { useQuery } from "@tanstack/react-query";
import { Context, isRpcSdk, Market } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { marketsRootQuery } from "./useMarket";
import { useChainTime } from "lib/state/chaintime";

export const marketStageRootKey = "market-stage";

/**
 * Get the current stage of a market.
 *
 * @param market Market<Context>
 * @returns useQuery<MarketStage, unknown, MarketStage>
 */
export const useMarketStage = (market?: Market<Context>) => {
  const [sdk, id] = useSdkv2();

  const now = useChainTime();

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
