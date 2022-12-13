import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "chain-time";

export const useChainTimeNow = () => {
  const [sdk, id] = useSdkv2();

  return useQuery<ChainTime | null>(
    [rootKey, id],
    async () => sdk.model.time.now(),

    {
      enabled: Boolean(sdk) && isRpcSdk(sdk),
      refetchInterval: 12 * 1000,
    },
  );
};
