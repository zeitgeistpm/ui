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

export const rootKey = "pool-ztg-balance";

export const usePoolZtgBalance = (account?: KeyringPairOrExtSigner) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, account?.address],
    async () => {
      if (isRpcSdk(sdk)) {
        try {
          const balances = await sdk.context.api.query.system.account(
            account.address,
          );

          return balances;
        } catch (error) {
          console.error("ERR");
          console.log(account.address);
        }
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && account && account.address),
    },
  );

  return query;
};
