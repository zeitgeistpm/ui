import { BaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk-next";
import { ChainName } from "./chains";

type ForeignAssetMetadata = {
  [foreignAssetId: number]: {
    coinGeckoId: string;
    originChain?: ChainName;
    image?: string;
    withdrawSupported: boolean;
    withdrawDestinationFee?: string;
    tokenSymbol: string;
  };
};

export const lookupAssetImagePath = (foreignAssetId?: number) => {
  if (foreignAssetId == null) {
    return "/currencies/ztg.jpg";
  } else {
    return FOREIGN_ASSET_METADATA[foreignAssetId].image;
  }
};

export const lookupAssetSymbol = (baseAssetId?: BaseAssetId) => {
  const foreignAssetId = IOForeignAssetId.is(baseAssetId)
    ? baseAssetId.ForeignAsset
    : null;
  if (foreignAssetId == null) {
    return "ZTG";
  } else {
    return FOREIGN_ASSET_METADATA[foreignAssetId].tokenSymbol;
  }
};

const BATTERY_STATION_FOREIGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    image: "/currencies/dot.png",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "DOT",
  },
  1: {
    originChain: "Rococo",
    image: "/currencies/rococo.png",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
    tokenSymbol: "ROC",
  },
};

const PROD_FOREIGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    originChain: "Polkadot",
    image: "/currencies/dot.png",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
    tokenSymbol: "DOT",
  },
};

export const FOREIGN_ASSET_METADATA: ForeignAssetMetadata =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? PROD_FOREIGN_ASSET_METADATA
    : BATTERY_STATION_FOREIGN_ASSET_METADATA;
