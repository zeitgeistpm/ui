import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  isRpcSdk,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";

export type AssetMetadata = {
  symbol: string;
  name: string;
};

export const assetMetadataRootKey = "asset-metadata";

export const useAssetMetadata = (assetId: AssetId) => {
  const [sdk, id] = useSdkv2();
  const { data: constants } = useChainConstants();

  const query = useQuery(
    [id, assetMetadataRootKey, assetId],
    async () => {
      if (isRpcSdk(sdk)) {
        if (IOZtgAssetId.is(assetId)) {
          const assetMetadata: AssetMetadata = {
            symbol: constants.tokenSymbol,
            name: "Zeitgeist",
          };
          return assetMetadata;
        } else if (IOForeignAssetId.is(assetId)) {
          const metadata = await sdk.api.query.assetRegistry.metadata(assetId);

          const assetMetadata: AssetMetadata = {
            symbol: metadata.unwrap().symbol.toString(),
            name: metadata.unwrap().name.toString(),
          };

          return assetMetadata;
        } else {
          return null;
        }
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && assetId),
      keepPreviousData: true,
      staleTime: Infinity,
    },
  );

  return query;
};
