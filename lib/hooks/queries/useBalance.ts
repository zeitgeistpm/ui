import { useQuery } from "@tanstack/react-query";
import { AssetId, IOZtgAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";
import { calculateFreeBalance } from "lib/util/calc-free-balance";

export const balanceRootKey = "balance";

export const useBalance = (
  address?: string,
  assetId?: AssetId,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();
  const query = useQuery(
    [id, balanceRootKey, "free", address, assetId, blockNumber],
    async () => {
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
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && address && isRpcSdk(sdk) && assetId),
    },
  );

  return query;
};

export const useLockedBalance = (
  address?: string,
  assetId?: AssetId,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, balanceRootKey, "locked", address, assetId, blockNumber],
    async () => {
      if (address && assetId && isRpcSdk(sdk)) {
        const api = await getApiAtBlock(sdk.api, blockNumber);

        if (IOZtgAssetId.is(assetId)) {
          const { data } = await api.query.system.account(address);
          return new Decimal(data.miscFrozen.toString());
        } else {
          const balance = await api.query.tokens.accounts(address, assetId);
          return new Decimal(balance.frozen.toString());
        }
      }
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && address && isRpcSdk(sdk) && assetId),
    },
  );

  return query;
};
