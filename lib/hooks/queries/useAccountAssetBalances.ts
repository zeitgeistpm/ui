import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import { AssetId, isRpcSdk, NA } from "@zeitgeistpm/sdk-next";
import objectHash from "object-hash";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-asset-balance";

export const useAccountAssetBalances = (
  pairs: {
    account?: string;
    assetId: AssetId;
  }[],
) => {
  const [sdk, id] = useSdkv2();

  const query = useQueries({
    queries: pairs.map((pair) => {
      return {
        queryKey: [id, rootKey, pair.account, pair.assetId],
        queryFn: async () => {
          if (isRpcSdk(sdk)) {
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
