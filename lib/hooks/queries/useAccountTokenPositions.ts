import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import { AccountBalancesQuery } from "@zeitgeistpm/indexer";
import {
  CategoricalAssetId,
  isIndexedSdk,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-token-positions";

export const useAccountTokenPositions = (account?: string) => {
  const [sdk, id] = useSdkv2();

  return useQuery<AccountBalancesQuery["accountBalances"]>(
    [id, rootKey, account],
    async () => {
      if (sdk && isIndexedSdk(sdk) && account) {
        const { accountBalances } = await sdk.context.indexer.accountBalances({
          where: {
            account: {
              accountId_eq: account,
            },
          },
        });

        return accountBalances;
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && account),
      refetchInterval: 12 * 1000,
    },
  );
};
