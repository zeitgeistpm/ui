import { ApiPromise } from "@polkadot/api";
import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOMarketOutcomeAssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  getMarketIdOf,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { LAST_MARKET_ID_BEFORE_ASSET_MIGRATION } from "lib/constants";
import { calculateFreeBalance } from "lib/util/calc-free-balance";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useSdkv2 } from "../useSdkv2";

export const balanceRootKey = "balance";

export const useBalance = (
  address?: string,
  assetId?: AssetId,
  blockNumber?: number,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, balanceRootKey, address, assetId, blockNumber],
    async () => {
      if (address && assetId && isRpcSdk(sdk)) {
        const api = await getApiAtBlock(sdk.api, blockNumber);
        return fetchAssetBalance(api, address, assetId);
      }
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && address && isRpcSdk(sdk) && assetId),
    },
  );

  return query;
};

export const fetchAssetBalance = async (
  api: ApiPromise,
  address: string,
  assetId: AssetId,
) => {
  if (IOZtgAssetId.is(assetId)) {
    const { data } = await api.query.system.account(address);
    return calculateFreeBalance(
      data?.free?.toString(),
      data?.frozen?.toString(),
      data?.reserved?.toString(),
    );
  } else if (IOForeignAssetId.is(assetId)) {
    const balance = await api.query.tokens.accounts(address, assetId);
    return new Decimal(balance.free.toString());
  } else if (IOMarketOutcomeAssetId.is(assetId)) {
    if (getMarketIdOf(assetId) > LAST_MARKET_ID_BEFORE_ASSET_MIGRATION) {
      const balance = await api.query.marketAssets.account(assetId, address);
      return new Decimal((balance as any).unwrap().balance.toString());
    } else {
      const balance = await api.query.tokens.accounts(address, assetId);
      return new Decimal(balance.free.toString());
    }
  } else {
    const balance = await api.query.tokens.accounts(address, assetId);
    return new Decimal(balance.free.toString());
  }
};
