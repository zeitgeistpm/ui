import { useQuery } from "@tanstack/react-query";
import { AssetId, IOZtgAssetId, isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";

export const balanceRootKey = "balance";

export const useBalance = (
  address: string,
  assetId: AssetId,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, balanceRootKey, address, blockNumber],
    async () => {
      if (address && isRpcSdk(sdk)) {
        const api = await getApiAtBlock(sdk.api, blockNumber);

        if (IOZtgAssetId.is(assetId)) {
          const balance = await api.query.system.account(address);
          return new Decimal(balance.data.free.toString());
        } else {
          const balance = await api.query.tokens.accounts(address, assetId);
          return new Decimal(balance.free.toString());
        }
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && address && isRpcSdk(sdk)),
    },
  );

  return query;
};
