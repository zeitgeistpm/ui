import { useQuery } from "@tanstack/react-query";
import type { HistoricalAccountBalanceWhereInput } from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";

export const mintedInCourtRootKey = "minted-in-court";

export const useMintedInCourt = (
  filter: Partial<{
    account: string;
    limit: number;
    offset: number;
  }>,
) => {
  const [sdk, id] = useSdkv2();

  const enabled = sdk && isIndexedSdk(sdk);

  const query = useQuery(
    [id, mintedInCourtRootKey],
    async () => {
      if (enabled) {
        const response = await sdk.indexer.historicalAccountBalances({
          where: {
            event_eq: "MintedInCourt",
            accountId_eq: filter.account,
          },
          limit: filter.limit,
          offset: filter.offset,
        });

        return response.historicalAccountBalances;
      }
    },
    {
      enabled: Boolean(enabled),
      staleTime: 30_000,
    },
  );
  return query;
};
