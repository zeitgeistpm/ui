import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  IOCampaignAssetId,
  ZTG,
  isRpcSdk,
} from "@zeitgeistpm/sdk";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";
import Decimal from "decimal.js";
import { campaignID } from "lib/constants";

export type AssetMetadata = {
  symbol: string;
  name: string;
  location: XcmVersionedMultiLocation | null;
  feeFactor: Decimal;
  decimals: number;
  totalIssuance?: number;
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
        } else if (IOCampaignAssetId.is(assetId)) {
          const campaignAssetDetails =
            await sdk.api.query.campaignAssets.metadata(0);
          const campaignMeta: AssetMetadata = {
            symbol: campaignAssetDetails.symbol.toPrimitive() as string,
            name: campaignAssetDetails.name.toPrimitive() as string,
            feeFactor: new Decimal(100), //specified in docs
            location: null, //not present in campaign assets
            decimals: Number(campaignAssetDetails.name.toString()),
          };
          return campaignMeta;
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
      const totalZtgIssuance = Number(
        await sdk.api.query.balances.totalIssuance(),
      );
      let res: [number | "Ztg", AssetMetadata][] = [
        [
          "Ztg",
          {
            symbol: constants.tokenSymbol,
            name: "Zeitgeist",
            location: null,
            feeFactor: ZTG,
            decimals: 10,
            totalIssuance: totalZtgIssuance,
          },
        ],
      ];
      const campaignAssetDetails = await sdk.api.query.campaignAssets.asset(0);
      const allCampaignAssetMetadata =
        await sdk.api.query.campaignAssets.metadata.entries();

      const totalCampaignAssetIssuance = Number(
        campaignAssetDetails.value.supply.toString(),
      );
      const campaignMeta: [number, AssetMetadata][] =
        allCampaignAssetMetadata.reduce(
          (accumulator, meta, index) => {
            const campaignAssetId = index;
            const assetMetadata: AssetMetadata = {
              symbol: meta[1].symbol.toPrimitive() as string,
              name: meta[1].name.toPrimitive() as string,
              feeFactor: new Decimal(100), //specified in docs
              location: null, //not present in campaign assets
              decimals: Number(meta[1].name.toString()),
              totalIssuance: totalCampaignAssetIssuance,
            };
            accumulator.push([campaignAssetId, assetMetadata]);
            return accumulator;
          },
          [] as [number, AssetMetadata][],
        );

      res = [...res, ...campaignMeta];

      const allForeignAssetMetadata =
        await sdk.api.query.assetRegistry.metadata.entries();

      for (const meta of allForeignAssetMetadata) {
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
