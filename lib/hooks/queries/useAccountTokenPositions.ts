import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { encodeAddress } from "@polkadot/util-crypto";

export const positionsRootKey = "account-token-positions";

export const useAccountTokenPositions = (address?: string) => {
  const [sdk, id] = useSdkv2();
  // ("5CkxsFF61ggucjmdoTARy6v2pfLw5VLDi2yKAHMj3n2G6bKq");
  // ("dE3phcNpdXRzK8RQnWej9C87CJ3AphKwCYXniTKAqiaUfdfCz");
  const zeitgeistAddress = encodeAddress(
    "5CkxsFF61ggucjmdoTARy6v2pfLw5VLDi2yKAHMj3n2G6bKq",
    73,
  );
  console.log(`Zeitgeist Address: ${zeitgeistAddress}`);

  return useQuery(
    [id, positionsRootKey, address],
    async () => {
      if (sdk && isIndexedSdk(sdk) && address) {
        const { accountBalances } = await sdk.indexer.accountBalances({
          where: {
            account: {
              accountId_eq: "dDyiQf6wUFXYXgEyrqVbYybXe7AN6Qj5sbWUPfPvkvREv84in",
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
