import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isRpcData, isRpcSdk, NA, PoolGetQuery } from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "ztg-balance";

export const useZtgBalance = (account?: KeyringPairOrExtSigner) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, account?.address],
    async () => {
      if (account && isRpcSdk(sdk)) {
        const balance = await sdk.context.api.query.system.account(
          account.address,
        );
        return new Decimal(balance.data.free.toString());
      }
      return NA;
    },
    {
      initialData: NA,
      keepPreviousData: true,
      enabled: Boolean(sdk && account && isRpcSdk(sdk)),
    },
  );

  return query;
};
