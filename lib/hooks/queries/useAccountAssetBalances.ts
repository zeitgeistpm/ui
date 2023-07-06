import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { AssetId, isRpcSdk, RpcContext } from "@zeitgeistpm/sdk-next";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";
import { useMemo } from "react";

export type UseAccountAssetBalances = {
  /**
   * Get a single balance by account and asset id.
   */
  get: (
    account: string,
    assetId: AssetId,
  ) =>
    | UseQueryResult<
        {
          pair: AccountAssetIdPair;
          balance?: OrmlTokensAccountData;
        },
        unknown
      >
    | undefined;
  /**
   * Raw react query access.
   */
  query: UseQueryResult<
    {
      pair: AccountAssetIdPair;
      balance?: OrmlTokensAccountData;
    },
    unknown
  >[];

  /**
   * Will be true if any of the queries are loading
   */
  isLoading: boolean;
};

/**
 * Pair of account and asset id.
 */
export type AccountAssetIdPair = {
  account?: string;
  assetId: AssetId;
};

export const accountAssetBalanceRootKey = "account-asset-balance";

/**
 * Fetch account balances for a list of account/asset pairs.
 *
 * @param pairs AccountAssetIdPair[]
 * @returns UseAccountAssetBalances
 */
export const useAccountAssetBalances = (
  pairs: AccountAssetIdPair[],
  blockNumber?: number,
  opts?: {
    enabled?: boolean;
  },
): UseAccountAssetBalances => {
  const [sdk, id] = useSdkv2();

  const queries = useQueries({
    queries: pairs.map((pair) => {
      return {
        queryKey: [
          id,
          accountAssetBalanceRootKey,
          pair.account,
          pair.assetId,
          blockNumber,
        ],
        queryFn: async () => {
          const api = await getApiAtBlock(sdk!.asRpc().api, blockNumber);
          let balance;
          if (pair.account) {
            balance = await api.query.tokens.accounts(
              pair.account,
              pair.assetId,
            );
          }

          return {
            pair,
            balance,
          };
        },
        enabled:
          Boolean(sdk) &&
          isRpcSdk(sdk) &&
          (typeof opts?.enabled === "undefined" ? true : opts?.enabled),
        keepPreviousData: true,
      };
    }),
  });

  const get = (account: string, assetId: AssetId) => {
    const query = queries.find(
      (q) =>
        q.data != null &&
        q.data.pair.account === account &&
        JSON.stringify(q.data.pair.assetId) === JSON.stringify(assetId),
    );
    return query;
  };

  return { get, query: queries, isLoading: queries.some((q) => q.isLoading) };
};
