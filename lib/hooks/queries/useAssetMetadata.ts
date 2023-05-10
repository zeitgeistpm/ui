import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  isRpcSdk,
} from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";

export type AssetMetadata = {
  symbol: string;
  name: string;
  location: XcmVersionedMultiLocation;
};

export const assetMetadataRootKey = "asset-metadata";

export const useAssetMetadata = (assetId: AssetId) => {
  const [sdk, id] = useSdkv2();
  const { data: constants } = useChainConstants();

  const query = useQuery(
    [id, assetMetadataRootKey, assetId, constants?.tokenSymbol],
    async () => {
      if (isRpcSdk(sdk)) {
        if (IOZtgAssetId.is(assetId)) {
          const assetMetadata: AssetMetadata = {
            symbol: constants?.tokenSymbol,
            name: "Zeitgeist",
            location: null,
          };
          return assetMetadata;
        } else if (IOForeignAssetId.is(assetId)) {
          const metadata = await sdk.api.query.assetRegistry.metadata(assetId);
          const loc: XcmVersionedMultiLocation = metadata.unwrapOr(null)
            .location.isSome
            ? metadata.unwrap().location.unwrap()
            : null;

          const assetMetadata: AssetMetadata = {
            symbol: metadata.unwrap().symbol.toPrimitive() as string,
            name: metadata.unwrap().name.toPrimitive() as string,
            location: loc,
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
