import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";

export const positionsRootKey = "account-token-positions";

export const useAccountTokenPositions = (address?: string) => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, positionsRootKey, address],
    async () => {
      if (sdk && isIndexedSdk(sdk) && address) {
        const { accountBalances } = await sdk.indexer.accountBalances({
          where: {
            account: {
              accountId_eq: address,
            },
            balance_gt: 0,
          },
        });

        return accountBalances;
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && address),
      refetchInterval: 12 * 1000,
      staleTime: Infinity,
    },
  );
};
