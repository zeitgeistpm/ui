import { AssetId, BaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { ChainName } from "./chains";
import { isCampaignAsset, campaignLabel } from ".";

type ForeignAssetMetadata = {
  [foreignAssetId: number]: {
    coinGeckoId: string;
    originChain?: ChainName;
    image: string;
    withdrawSupported: boolean;
    withdrawDestinationFee?: string;
    tokenSymbol: string;
    subsquidId?: string;
  };
};

export const lookupAssetImagePath = (assetId?: AssetId | null) => {
  if (isCampaignAsset) {
    return "/currencies/wsx-currency.png";
  } else if (IOForeignAssetId.is(assetId)) {
    return FOREIGN_ASSET_METADATA[assetId.ForeignAsset].image;
  } else {
    return "/currencies/ztg.svg";
  }
};

export const lookupAssetSymbol = (baseAssetId?: BaseAssetId) => {
  const foreignAssetId = IOForeignAssetId.is(baseAssetId)
    ? baseAssetId.ForeignAsset
    : null;
  if (isCampaignAsset) {
    return campaignLabel;
  } else if (foreignAssetId == null) {
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
    subsquidId: "DOT",
  },
  1: {
    originChain: "Rococo",
    image: "/currencies/rococo.svg",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
    tokenSymbol: "ROC",
  },
  3: {
    //todo: add WSX logo
    image: "/currencies/wsx-currency.png",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "WSX",
  },
  4: {
    //todo: add NTT logo
    image: "/currencies/ausd.jpg",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "NTT",
  },
};

const PROD_FOREIGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    originChain: "Polkadot",
    image: "/currencies/dot.png",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
    tokenSymbol: "DOT",
    subsquidId: "DOT",
  },
  1: {
    originChain: "Moonbeam",
    image: "/currencies/usdc.svg",
    withdrawSupported: false,
    coinGeckoId: "usd",
    tokenSymbol: "USDC",
    subsquidId: "USDC",
  },
  2: {
    image: "/currencies/wsx-currency.png",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "WSX",
  },
};

export const FOREIGN_ASSET_METADATA: ForeignAssetMetadata =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? PROD_FOREIGN_ASSET_METADATA
    : BATTERY_STATION_FOREIGN_ASSET_METADATA;

export const findAssetImageForSymbol = (symbol?: string): string => {
  const foreignAssetId = Object.keys(FOREIGN_ASSET_METADATA).find(
    (foreignAssetId) =>
      FOREIGN_ASSET_METADATA[foreignAssetId].tokenSymbol === symbol,
  );
  if (symbol === undefined || foreignAssetId === undefined) {
    return lookupAssetImagePath();
  }
  return lookupAssetImagePath({ ForeignAsset: Number(foreignAssetId) });
};
