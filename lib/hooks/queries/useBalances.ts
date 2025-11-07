import { useQueries } from "@tanstack/react-query";
import { AssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";
import { balanceRootKey, fetchAssetBalance } from "./useBalance";
import { CombinatorialToken } from "lib/types/combinatorial";

export const useBalances = (
  assetIds: (AssetId | CombinatorialToken)[],
  address?: string,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const queries = useQueries({
    queries: assetIds.map((assetId) => {
      return {
        queryKey: [id, balanceRootKey, address, assetId, blockNumber],
        queryFn: async () => {
          if (address && assetId && isRpcSdk(sdk)) {
            const api = await getApiAtBlock(sdk.api, blockNumber);

            return fetchAssetBalance(api, address, assetId);
          }
        },
        enabled: Boolean(sdk && address && isRpcSdk(sdk) && assetId),
        keepPreviousData: true,
      };
    }),
  });

  return queries;
};
