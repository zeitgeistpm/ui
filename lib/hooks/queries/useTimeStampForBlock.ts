import { useSdkv2 } from "../useSdkv2";
import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { getApiAtBlock } from "lib/util/get-api-at";

export const useTimeStampForBlock = (blockNumber: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, blockNumber],
    async () => {
      if (isRpcSdk(sdk)) {
        const api = await getApiAtBlock(sdk.api, blockNumber);
        return await api.query.timestamp.now().then((now) => now.toNumber());
      }
      return null;
    },
    {
      enabled: isRpcSdk(sdk),
    },
  );

  return query;
};
