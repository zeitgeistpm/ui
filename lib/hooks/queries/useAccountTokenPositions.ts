import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { encodeAddress } from "@polkadot/util-crypto";

export const positionsRootKey = "account-token-positions";

export const useAccountTokenPositions = (address?: string) => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, positionsRootKey, address],
    async () => {
      if (sdk && isIndexedSdk(sdk) && address) {
        const ztgAddress = encodeAddress(address, 73);
        const { accountBalances } = await sdk.indexer.accountBalances({
          where: {
            account: {
              accountId_eq: ztgAddress,
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
