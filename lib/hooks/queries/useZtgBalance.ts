import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isRpcData, isRpcSdk, PoolGetQuery } from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "ztg-balance";

export const useZtgBalance = (account?: KeyringPairOrExtSigner) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, account?.address],
    async () => {
      if (account && isRpcSdk(sdk)) {
        return sdk.context.api.query.system.account(account.address);
      }
    },
    {
      enabled: Boolean(sdk && account && isRpcSdk(sdk)),
    },
  );

  return query;
};
