import { useQuery } from "@tanstack/react-query";
import {
  Context,
  getDisputeMechanism,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { useMarket } from "./useMarket";

export const marketDisputesRootKey = "market-disputes";

export const useMarketDisputes = (
  marketIdentifier: Market<Context> | number,
) => {
  const [sdk, id] = useSdkv2();

  const marketId =
    typeof marketIdentifier === "number"
      ? marketIdentifier
      : marketIdentifier.marketId;

  const { data: market } = useMarket({ marketId });

  const enabled = sdk && isRpcSdk(sdk) && market;

  const query = useQuery(
    [id, marketDisputesRootKey, marketId],
    async () => {
      if (enabled) {
        const disputeMechanism = getDisputeMechanism(market).unwrap();

        if (disputeMechanism === "Authorized") {
          return market.disputes ?? [];
        }

        if (disputeMechanism === "Court") {
          // TODO: use dispute.by when its in the indexer
          const lastDispute = market.disputes?.[market.disputes.length - 1];
          return [
            {
              at: lastDispute?.at,
              //by: (market.bonds as any)?.dispute?.who ?? "unknown",
            },
          ];
        }

        return [];
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 100_000,
    },
  );
  return query;
};
