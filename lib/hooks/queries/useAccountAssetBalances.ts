import { useQuery } from "@tanstack/react-query";
import { AssetId, isRpcSdk, NA } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-asset-balance";

export const useAccountAssetBalances = (
  pairs: {
    account?: string;
    assetId: AssetId;
  }[],
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, pairs],
    async () => {
      if (isRpcSdk(sdk)) {
        return Promise.all(
          pairs.map(async ({ account, assetId }) => {
            if (!account) {
              return NA;
            }
            return sdk.context.api.query.tokens.accounts(account, assetId);
          }),
        );
      }
      return [];
    },
    {
      initialData: [],
      enabled: Boolean(sdk && isRpcSdk(sdk) && pairs && pairs.length),
    },
  );

  return query;
};
