import { ZeitgeistPrimitivesAsset } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import {
  HistoricalAssetOrderByInput,
  HistoricalAssetsQuery,
} from "@zeitgeistpm/indexer";
import {
  AssetId,
  isIndexedSdk,
  isRpcSdk,
  toCompositeIndexerAssetId,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "asset-prices";

export const useRpcPricesForAssets = (assets?: Array<AssetId>, at?: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery<any>(
    [id, rootKey],
    async () => {
      if (sdk && isRpcSdk(sdk)) {
        sdk.context.api.rpc.swaps.getSpotPrices;
      }
      return null;
    },
    {
      initialData: { get: () => null },
      enabled: Boolean(sdk && isRpcSdk(sdk) && assets?.length),
    },
  );

  return query;
};
