import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import { useMarket } from "./useMarket";

export const prizePoolRootKey = "prize-pool";

export const usePrizePool = (marketId: number) => {
  const [sdk, id] = useSdkv2();
  const { data: market } = useMarket({ marketId });

  const outcomeAsset = market?.outcomeAssets?.[0];
  const query = useQuery(
    [id, prizePoolRootKey, market],
    async () => {
      if (isRpcSdk(sdk) && outcomeAsset) {
        // prize pool is equal to the total issuance on any of the outcome assets
        const totalIssuance = await sdk.api.query.tokens.totalIssuance(
          JSON.parse(outcomeAsset),
        );

        return new Decimal(totalIssuance.toString());
      }
    },
    {
      enabled: Boolean(sdk && market && isRpcSdk(sdk) && outcomeAsset),
    },
  );

  return query;
};
