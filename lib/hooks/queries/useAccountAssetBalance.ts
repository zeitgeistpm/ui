import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  Context,
  getIndexOf,
  IOCategoricalAssetId,
  IOScalarAssetId,
  isIndexedData,
  isRpcData,
  isRpcSdk,
  Pool,
} from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-asset-balance";

export const useAccountAssetBalance = (
  account?: KeyringPairOrExtSigner,
  assetId?: AssetId,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, account?.address, assetId],
    async () => {
      if (isRpcSdk(sdk)) {
        try {
          const balances = await sdk.context.api.query.tokens.accounts(
            account.address,
            assetId,
          );

          return balances;
        } catch (error) {
          console.error("ERR");
          console.log(account.address, assetId);
        }
      }
    },
    {
      enabled: Boolean(
        sdk && isRpcSdk(sdk) && account && account.address && assetId,
      ),
    },
  );

  return query;
};
