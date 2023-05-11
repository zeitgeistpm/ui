type ForeignAssetMetadata = {
  [foreignAssetId: number]: {
    coinGeckoId: string;
    originChain?: string;
    image?: string;
    withdrawSupported: boolean;
    withdrawDestinationFee?: string;
  };
};

export const lookupAssetImagePath = (foreignAssetId?: number) => {
  if (foreignAssetId == null) {
    return "/currencies/ztg.jpg";
  } else {
    return FORIEGN_ASSET_METADATA[foreignAssetId].image;
  }
};

const BATTERY_STATION_FORIEGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    originChain: null,
    image: "/currencies/dot.png",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
  },
  1: {
    originChain: "Rococo",
    image: "/currencies/rococo.png",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
  },
};

const PROD_FORIEGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    originChain: "Polkadot",
    image: "/currencies/dot.png",
    withdrawSupported: true,
    coinGeckoId: "polkadot",
  },
};

export const FORIEGN_ASSET_METADATA: ForeignAssetMetadata =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "NEXT_PUBLIC_VERCEL_ENV"
    ? PROD_FORIEGN_ASSET_METADATA
    : BATTERY_STATION_FORIEGN_ASSET_METADATA;
