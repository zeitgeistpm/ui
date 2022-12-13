import { ZeitgeistPrimitivesAsset } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import {
  HistoricalAssetOrderByInput,
  HistoricalAssetsQuery,
} from "@zeitgeistpm/indexer";
import { isCodec } from "@polkadot/util";
import { AssetId, fromPrimitive, isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { camelcaseObjectKeys } from "lib/util/camelcase-object.keys";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "assets-price-history";

export type AssetIdPriceLookup = {
  get: (
    assetId: AssetId | ZeitgeistPrimitivesAsset,
  ) => HistoricalAssetsQuery["historicalAssets"];
};

export const useAssetsPriceHistory = (
  assets?: Array<AssetId>,
  filter?: { startTimeStamp: string },
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery<AssetIdPriceLookup>(
    [id, rootKey],
    async () => {
      if (isIndexedSdk(sdk)) {
        const history = await sdk.context.indexer.historicalAssets({
          where: {
            assetId_in: assets.map((asset) =>
              JSON.stringify(camelcaseObjectKeys(asset)),
            ),
            timestamp_gte: filter?.startTimeStamp ?? "0",
          },
          order: HistoricalAssetOrderByInput.BlockNumberAsc,
        });

        return {
          get: (assetId) => {
            const key = JSON.stringify(
              camelcaseObjectKeys(
                isCodec(assetId) ? fromPrimitive(assetId) : assetId,
              ),
            );
            return history?.historicalAssets.filter((historicalAsset) => {
              return historicalAsset.assetId === key;
            });
          },
        };
      }
    },
    {
      initialData: { get: () => null },
      enabled: Boolean(sdk && isIndexedSdk(sdk) && filter && assets?.length),
    },
  );

  return query;
};
