import { AssetId, BaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { ChainName } from "./chains";
import { hexToU8a } from "@polkadot/util";
import Keyring from "@polkadot/keyring";

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
  if (IOForeignAssetId.is(assetId)) {
    return FOREIGN_ASSET_METADATA[assetId.ForeignAsset].image;
  } else {
    return "/currencies/ztg.svg";
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
  3: {
    //todo: remove
    image: "/currencies/ausd.jpg",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "WSX",
  },
  4: {
    //todo: remove
    image: "/currencies/ausd.jpg",
    withdrawSupported: false,
    coinGeckoId: "polkadot",
    tokenSymbol: "NTT",
  },
};

export const FOREIGN_ASSET_MULTILOCATION = {
  0: {
    parents: 1
  },
  1: {
    parents: 1,
    interior: {
      X3: [
        {
          Parachain: 2004,
        },
        {
          PalletInstance: 110,
        },
        {
          AccountKey20: {
            network: null,
            key: hexToU8a('0x931715fee2d06333043d11f658c8ce934ac61d0c'),
          }
        },
      ],
    },
  },
  4: {
    parents: 1,
    interior: {
      X3: [
        {
          Parachain: 1000
        },
        {
          PalletInstance: 50
        },
        {
          GeneralIndex: 1337
        }
      ]
    }
  }
}

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
  4: {
    originChain: "AssetHub",
    image: "/currencies/usdc.svg",
    withdrawSupported: false,
    coinGeckoId: "usd",
    tokenSymbol: "USDC",
    subsquidId: "USDC",
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
