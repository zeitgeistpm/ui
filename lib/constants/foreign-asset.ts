import { BaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { ChainName } from "./chains";

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

export const lookupAssetImagePath = (foreignAssetId?: number | null) => {
  if (foreignAssetId == null) {
    return "/currencies/ztg.svg";
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
    subsquidId: "DOT",
  },
  1: {
    originChain: "Rococo",
    image: "/currencies/rococo.svg",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
    tokenSymbol: "ROC",
  },
  4: {
    //todo: add NTT logo
    image: "/currencies/NTT-currency.png",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "NTT",
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
};

export const FOREIGN_ASSET_METADATA: ForeignAssetMetadata =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? PROD_FOREIGN_ASSET_METADATA
    : BATTERY_STATION_FOREIGN_ASSET_METADATA;

export const findAssetImageForSymbol = (symbol?: string): string => {
  if (symbol === undefined) {
    return lookupAssetImagePath();
  }
  const foreignAssetId = Object.keys(FOREIGN_ASSET_METADATA).find(
    (foreignAssetId) =>
      FOREIGN_ASSET_METADATA[foreignAssetId].tokenSymbol === symbol,
  );
  return lookupAssetImagePath(Number(foreignAssetId));
};
