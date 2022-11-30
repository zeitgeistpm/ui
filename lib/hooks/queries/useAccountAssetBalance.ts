import { useQuery } from "@tanstack/react-query";
import { AssetId, isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-asset-balance";

export const useAccountAssetBalance = (
  pairs: {
    account: string;
    assetId: AssetId;
  }[],
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, pairs],
    async () => {
      if (isRpcSdk(sdk)) {
        console.log("useAccountAssetBalance query");
        return sdk.context.api.query.tokens.accounts.multi(
          pairs.map(({ account, assetId }) => [account, assetId]),
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
