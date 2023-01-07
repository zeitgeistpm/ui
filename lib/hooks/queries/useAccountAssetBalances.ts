import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { AssetId, isRpcSdk, NA } from "@zeitgeistpm/sdk-next";
import objectHash from "object-hash";
import { useSdkv2 } from "../useSdkv2";

export type UseAccountAssetBalances = {
  /**
   * Get a single balance by account and asset id.
   */
  get: (account: string, assetId: AssetId) => null | NA | OrmlTokensAccountData;
  /**
   * Raw react query access.
   */
  query: UseQueryResult<
    {
      pair: AccountAssetIdPair;
      balance: NA | OrmlTokensAccountData;
    },
    unknown
  >[];
};

/**
 * Pair of account and asset id.
 */
export type AccountAssetIdPair = {
  account?: string;
  assetId: AssetId;
};

export const rootKey = "account-asset-balance";

/**
 * Fetch account balances for a list of account/asset pairs.
 *
 * @param pairs AccountAssetIdPair[]
 * @returns UseAccountAssetBalances
 */
export const useAccountAssetBalances = (
  pairs: AccountAssetIdPair[],
): UseAccountAssetBalances => {
  const [sdk, id] = useSdkv2();

  const query = useQueries({
    queries: pairs.map((pair) => {
      return {
        queryKey: [id, rootKey, pair.account, pair.assetId],
        queryFn: async () => {
          if (sdk && isRpcSdk(sdk)) {
            const balance = !pair.account
              ? NA
              : await sdk.context.api.query.tokens.accounts(
                  pair.account,
                  pair.assetId,
                );

            return {
              pair,
              balance,
            };
          }
        },
        enabled: Boolean(sdk) && isRpcSdk(sdk),
        keepPreviousData: true,
      };
    }),
  });

  const get = (account: string, assetId: AssetId) => {
    return query.find(
      (q) =>
        q.data &&
        q.data.pair.account === account &&
        objectHash(q.data.pair.assetId) === objectHash(assetId),
    )?.data?.balance;
  };

  return { get, query };
};
