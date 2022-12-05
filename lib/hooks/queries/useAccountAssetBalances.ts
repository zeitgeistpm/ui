import { useQueries, UseQueryOptions } from "@tanstack/react-query";
import { AssetId, isRpcSdk, NA } from "@zeitgeistpm/sdk-next";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";
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
    queries: pairs.map<UseQueryOptions<NA | OrmlTokensAccountData>>((pair) => {
      return {
        queryKey: [id, rootKey, objectHash(pair)],
        queryFn: async () => {
          if (isRpcSdk(sdk)) {
            if (!pair.account) {
              return NA;
            }
            return sdk.context.api.query.tokens.accounts(
              pair.account,
              pair.assetId,
            );
          }
        },
        enabled: Boolean(sdk) && isRpcSdk(sdk),
        keepPreviousData: true,
      };
    }),
  });

  return query.flatMap((q) => q.data);
};
