import { useQueries } from "@tanstack/react-query";
import { AssetId, IOZtgAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calculateFreeBalance } from "lib/util/calc-free-balance";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";
import { balanceRootKey } from "./useBalance";

export const useBalances = (
  assetIds: AssetId[],
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

            if (IOZtgAssetId.is(assetId)) {
              const { data } = await api.query.system.account(address);
              return calculateFreeBalance(
                data.free.toString(),
                data.miscFrozen.toString(),
                data.feeFrozen.toString(),
              );
            } else {
              const balance = await api.query.tokens.accounts(address, assetId);
              return new Decimal(balance.free.toString());
            }
          }
        },
        enabled: Boolean(sdk && address && isRpcSdk(sdk) && assetId),
        keepPreviousData: true,
      };
    }),
  });

  return queries;
};
