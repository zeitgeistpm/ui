import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { TimeFilter } from "components/ui/TimeFilters";
import { HistoricalAccountBalanceOrderByInput } from "@zeitgeistpm/indexer";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-balance-history";

export const useAccountBalanceHistory = (
  account?: string,
  filter?: TimeFilter,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, account, filter],
    async () => {
      if (sdk && isIndexedSdk(sdk) && account && filter) {
        const history = await sdk.indexer.historicalAccountBalances({
          where: {
            accountId_eq: account,
            timestamp_gt: filter.time,
          },
          order: HistoricalAccountBalanceOrderByInput.TimestampDesc,
        });

        if (history.historicalAccountBalances.length > 0) {
          return history.historicalAccountBalances;
        }

        const lastBalanceRecord = await sdk.indexer.historicalAccountBalances({
          where: {
            accountId_eq: account,
          },
          order: HistoricalAccountBalanceOrderByInput.TimestampDesc,
          limit: 1,
        });

        return lastBalanceRecord.historicalAccountBalances;
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk) && account && filter),
    },
  );

  return query;
};
