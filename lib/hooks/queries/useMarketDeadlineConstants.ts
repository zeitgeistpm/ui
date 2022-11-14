import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "pools";

export type MarketDeadlineConstants = {
  minDisputeDuration: number;
  minOracleDuration: number;
  maxDisputeDuration: number;
  maxOracleDuration: number;
  maxGracePeriod: number;
};

export const useMarketDeadlineConstants = () => {
  const [sdk, id] = useSdkv2();

  return useQuery<MarketDeadlineConstants>(
    [rootKey, id],
    async () => {
      if (isRpcSdk(sdk)) {
        return {
          minDisputeDuration: Number(
            sdk.context.api.consts.predictionMarkets.minDisputeDuration,
          ),
          minOracleDuration: Number(
            sdk.context.api.consts.predictionMarkets.minOracleDuration,
          ),
          maxDisputeDuration: Number(
            sdk.context.api.consts.predictionMarkets.maxDisputeDuration,
          ),
          maxOracleDuration: Number(
            sdk.context.api.consts.predictionMarkets.maxOracleDuration,
          ),
          maxGracePeriod: Number(
            sdk.context.api.consts.predictionMarkets.maxGracePeriod,
          ),
        };
      }
      return {
        minDisputeDuration: 3600,
        minOracleDuration: 300,
        maxDisputeDuration: 216000,
        maxOracleDuration: 100800,
        maxGracePeriod: 2628000,
      };
    },
    {
      enabled: Boolean(sdk),
    },
  );
};
