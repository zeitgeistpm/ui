import { useQuery } from "@tanstack/react-query";
import { isRpcSdk, NA } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "ztg-balance";

export const useZtgBalance = (address: string, blockNumber?: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, address],
    async () => {
      if (address && isRpcSdk(sdk)) {
        const api = await getApiAtBlock(sdk.context.api, blockNumber);

        const balance = await api.query.system.account(address);
        return new Decimal(balance.data.free.toString());
      }
      return NA;
    },
    {
      initialData: NA,
      keepPreviousData: true,
      enabled: Boolean(sdk && address && isRpcSdk(sdk)),
    },
  );

  return query;
};
