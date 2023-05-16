type ForeignAssetMetadata = {
  [foreignAssetId: number]: {
    coinGeckoId: string;
  };
};

export const FORIEGN_ASSET_METADATA: ForeignAssetMetadata = {
  0: {
    coinGeckoId: "polkadot",
  },
  1: {
    coinGeckoId: "bitcoin",
  },
};
