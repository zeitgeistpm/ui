import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import {
  PoolOrderByInput,
  HistoricalAccountBalanceOrderByInput,
} from "@zeitgeistpm/indexer";

export const creatorFeePayoutsRootKey = "creator-fee-payouts";

export const useCreatorFeePayouts = (address?: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, creatorFeePayoutsRootKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { historicalAccountBalances: events } =
          await sdk.indexer.historicalAccountBalances({
            where: {
              event_contains: "MarketCreatorFeesPaid",
              accountId_eq: address,
            },
            order: HistoricalAccountBalanceOrderByInput.BlockNumberDesc,
          });

        return events.filter((event) => new Decimal(event.dBalance).gt(0));
      }
    },
    {
      enabled: Boolean(sdk && address && isIndexedSdk(sdk)),
      staleTime: 10_000,
    },
  );

  return query;
};
