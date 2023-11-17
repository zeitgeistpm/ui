import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { encodeAddress } from "@polkadot/util-crypto";

export const positionsRootKey = "account-token-positions";

export const useAccountTokenPositions = (address?: string) => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, positionsRootKey, address],
    async () => {
      if (sdk && isRpcSdk(sdk) && address) {
        // todo: we may wish to add this back and stitch the two data sources together
        // to get back the fast initial load along with faster updates issue #1945
        // const { accountBalances } = await sdk.indexer.accountBalances({
        //   where: {
        //     account: {
        //       accountId_eq: address,
        //     },
        //     balance_gt: 0,
        //   },
        // });

        const accounts = await sdk.api.query.tokens.accounts.entries(address);

        const accountBalances = accounts
          .map((account) => {
            const assetId = account[0].args[1];
            const balance = account[1].free.toString();

            return { assetId, balance };
          })
          .filter((account) => Number(account.balance) > 0);

        return accountBalances;
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isRpcSdk(sdk) && address),
      staleTime: 10_000,
    },
  );
};
