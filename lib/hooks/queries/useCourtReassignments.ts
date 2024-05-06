import { useQuery } from "@tanstack/react-query";
import { HistoricalAccountBalanceOrderByInput } from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { uniqBy } from "lodash-es";
import { useSdkv2 } from "../useSdkv2";

export const reassignedInCourtRootKey = "reassigned-in-court";

export const useCourtReassignments = (
  filter: Partial<{
    account: string;
    limit: number;
    offset: number;
  }>,
) => {
  const [sdk, id] = useSdkv2();

  const enabled = sdk && isIndexedSdk(sdk) && filter.account;

  const query = useQuery(
    [id, reassignedInCourtRootKey, filter],
    async () => {
      if (enabled) {
        const response = await sdk.indexer.historicalAccountBalances({
          where: {
            accountId_eq: filter.account,
            extrinsic: {
              name_eq: "Court.reassign_court_stakes",
            },
          },
          order: HistoricalAccountBalanceOrderByInput.TimestampDesc,
          limit: filter.limit,
          offset: filter.offset,
        });

        return uniqBy(
          response.historicalAccountBalances,
          (hab) => hab.extrinsic?.hash,
        );
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 30_000,
    },
  );
  return query;
};
