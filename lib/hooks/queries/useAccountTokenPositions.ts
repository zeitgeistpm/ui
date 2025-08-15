import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
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

        return accountBalances.map(({ assetId, balance }) => ({
          assetId: parseAssetIdStringWithCombinatorial(assetId)!,
          balance,
        }));
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && address),
      staleTime: 10_000,
    },
  );
};
