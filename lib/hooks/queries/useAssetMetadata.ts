import {
  DefinedUseQueryResult,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
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
  location: XcmVersionedMultiLocation | null;
};

export const assetMetadataRootKey = "asset-metadata";

export const useAssetMetadata = (assetId?: AssetId) => {
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
          const location = metadata.unwrapOr(null)?.location.isSome
            ? metadata.unwrap().location.unwrap()
            : null;

          const assetMetadata: AssetMetadata = {
            symbol: metadata.unwrap().symbol.toPrimitive() as string,
            name: metadata.unwrap().name.toPrimitive() as string,
            location: location,
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

export const allAssetMetadataRootKey = "all-asset-metadata";

export const useAllAssetMetadata = () => {
  const [sdk, id] = useSdkv2();
  const { data: constants } = useChainConstants();

  const enabled = sdk && isRpcSdk(sdk) && constants?.tokenSymbol;

  const query = useQuery(
    [id, assetMetadataRootKey, constants?.tokenSymbol],
    async () => {
      if (!enabled) {
        return [];
      }
      let res: [number | "Ztg", AssetMetadata][] = [
        [
          "Ztg",
          {
            symbol: constants.tokenSymbol,
            name: "Zeitgeist",
            location: null,
          },
        ],
      ];
      const allMetadata = await sdk.api.query.assetRegistry.metadata.entries();
      for (const meta of allMetadata) {
        const foreignAssetId = meta[0].args[0].asForeignAsset.toNumber();
        const location = meta[1].unwrapOr(null)?.location.isSome
          ? meta[1].unwrap().location.unwrap()
          : null;
        const assetMetadata: AssetMetadata = {
          symbol: meta[1].unwrap().symbol.toPrimitive() as string,
          name: meta[1].unwrap().name.toPrimitive() as string,
          location: location,
        };
        res = [...res, [foreignAssetId, assetMetadata]];
      }
      return res;
    },
    {
      enabled: Boolean(enabled),
      keepPreviousData: true,
      placeholderData: [],
      staleTime: Infinity,
    },
  );

  return query;
};

export const allAssetMetadataWithBalanceRootKey =
  "all-asset-metadata-with-balance";
