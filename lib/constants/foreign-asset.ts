type ForeignAssetMetadata = {
  [foreignAssetId: number]: {
    coinGeckoId: string;
  };
};

const BATTERY_STATION_FORIEGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    coinGeckoId: "polkadot",
  },
  1: {
    coinGeckoId: "polkadot",
  },
};

const PROD_FORIEGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    coinGeckoId: "polkadot",
  },
};

export const FORIEGN_ASSET_METADATA: ForeignAssetMetadata =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "NEXT_PUBLIC_VERCEL_ENV"
    ? PROD_FORIEGN_ASSET_METADATA
    : BATTERY_STATION_FORIEGN_ASSET_METADATA;
