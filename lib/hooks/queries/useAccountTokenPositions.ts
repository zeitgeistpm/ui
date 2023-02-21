import { useQuery } from "@tanstack/react-query";
import {
  AccountBalanceOrderByInput,
  AccountBalancesQuery,
  AccountBalanceWhereInput,
} from "@zeitgeistpm/indexer";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-token-positions";

export const useAccountTokenPositions = (filter?: {
  where?: AccountBalanceWhereInput;
  order?: AccountBalanceOrderByInput | AccountBalanceOrderByInput[];
  offset?: number;
  limit?: number;
}) => {
  const [sdk, id] = useSdkv2();

  return useQuery<AccountBalancesQuery["accountBalances"]>(
    [id, rootKey, filter],
    async () => {
      if (sdk && isIndexedSdk(sdk) && filter) {
        const { accountBalances } = await sdk.indexer.accountBalances(filter);

        return accountBalances;
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && filter),
      refetchInterval: 12 * 1000,
    },
  );
};
