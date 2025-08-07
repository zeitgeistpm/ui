import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  ZTG,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";
import { StagingXcmVersionedMultiLocation } from "@polkadot/types/lookup";
import Decimal from "decimal.js";

export type AssetMetadata = {
  symbol: string;
  name: string;
  location: StagingXcmVersionedMultiLocation | null;
  feeFactor: Decimal;
  decimals: number;
};

export const assetMetadataRootKey = "asset-metadata";

export const useAssetMetadata = (assetId?: AssetId) => {
  const [sdk, id] = useSdkv2();
  const { data: constants } = useChainConstants();

  const query = useQuery(
    [id, assetMetadataRootKey, assetId, constants?.tokenSymbol],
    async () => {
      if (isRpcSdk(sdk)) {
        if (IOZtgAssetId.is(assetId) && constants?.tokenSymbol) {
          const assetMetadata: AssetMetadata = {
            symbol: constants?.tokenSymbol,
            name: "Zeitgeist",
            location: null,
            feeFactor: ZTG,
            decimals: 10,
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
            feeFactor: new Decimal(
              metadata
                .unwrapOr(null)
                ?.additional.xcm.feeFactor.unwrapOr(null)
                ?.toString() ?? ZTG,
            ),
            decimals: Number(metadata.unwrap().name.toString()),
          };

          return assetMetadata;
        } else {
          return null;
        }
      }
    },
    {
      enabled: Boolean(
        sdk && isRpcSdk(sdk) && assetId && constants?.tokenSymbol,
      ),
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
    [id, allAssetMetadataRootKey, constants?.tokenSymbol],
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
            feeFactor: ZTG,
            decimals: 10,
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
          feeFactor: new Decimal(
            meta[1]
              .unwrapOr(null)
              ?.additional.xcm.feeFactor.unwrapOr(null)
              ?.toString() ?? ZTG,
          ),
          decimals: Number(meta[1].unwrap().name.toString()),
        };
        res = [...res, [foreignAssetId, assetMetadata]];
      }
      return res;
    },
    {
      enabled: Boolean(enabled),
      keepPreviousData: true,
      staleTime: Infinity,
    },
  );
  return query;
};
