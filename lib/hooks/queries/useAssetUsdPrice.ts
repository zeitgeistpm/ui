import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  AssetId,
  IOZtgAssetId,
  IOForeignAssetId,
  ForeignAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { FOREIGN_ASSET_METADATA } from "lib/constants/foreign-asset";
import { isEmpty } from "lodash";

export const assetUsdPriceRootKey = "asset-usd-price";

export const useAssetUsdPrice = (assetId?: AssetId) => {
  const query = useQuery(
    [assetUsdPriceRootKey, assetId],
    async () => {
      if (IOZtgAssetId.is(assetId)) {
        return await getZTGPrice();
      } else if (IOForeignAssetId.is(assetId)) {
        return await getForeignAssetPrice(assetId);
      }

      return null;
    },
    {
      enabled: Boolean(assetId),
      refetchInterval: 1000 * 60,
      keepPreviousData: true,
      staleTime: Infinity,
    },
  );

  return query;
};

export type ForeignAssetPrices = {
  [key: string]: Decimal;
};

export const useAllForeignAssetUsdPrices = (): {
  data: ForeignAssetPrices;
  isLoading: boolean;
  queries: UseQueryResult[];
} => {
  const queries = useQueries({
    queries: Object.keys(FOREIGN_ASSET_METADATA)?.map((foreignAssetId) => {
      const assetId = parseAssetId({
        ForeignAsset: Number(foreignAssetId),
      }).unwrap();
      return {
        queryKey: [
          assetUsdPriceRootKey,
          parseAssetId({ ForeignAsset: Number(foreignAssetId) }).unrightOr(
            null,
          ),
        ],
        queryFn: async () => {
          if (IOForeignAssetId.is(assetId)) {
            return await getForeignAssetPrice(assetId);
          } else {
            return null;
          }
        },
        refetchInterval: 1000 * 60,
        keepPreviousData: true,
        staleTime: Infinity,
      };
    }),
  });

  const data = queries?.reduce((prices, query, index) => {
    const key = Object.keys(FOREIGN_ASSET_METADATA)[index];
    if (query.data && key) {
      prices[key] = query.data;
    }
    return prices;
  }, {});

  return {
    data: data,
    isLoading: queries.some((query) => query.isLoading === true),
    queries,
  };
};

export const getBaseAssetPrices = async (): Promise<ForeignAssetPrices> => {
  const coinGeckoIds = Object.values(FOREIGN_ASSET_METADATA).map(
    (asset) => asset.coinGeckoId,
  );
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(
      "%2C",
    )}&vs_currencies=usd`,
  );
  console.log(res.status);

  const json = await res.json();

  const assetPrices = Object.keys(
    FOREIGN_ASSET_METADATA,
  ).reduce<ForeignAssetPrices>((prices, assetNumber) => {
    const assetMetadata = FOREIGN_ASSET_METADATA[Number(assetNumber)];
    const coinGeckoId = assetMetadata.coinGeckoId;
    const assetPrice = json[coinGeckoId].usd;
    prices[assetNumber] = new Decimal(assetPrice);

    return prices;
  }, {});

  return assetPrices;
};

//try: https://api.coingecko.com/api/v3/simple/price?ids=zeitgeist%2Cpolkadot&vs_currencies=usd
export const getForeignAssetPriceServerSide = async (
  foreignAsset: ForeignAssetId,
) => {
  const coinGeckoId =
    FOREIGN_ASSET_METADATA[foreignAsset.ForeignAsset].coinGeckoId;

  const res = await fetch(
    `https://staging.zeitgeist.pm/api/usd-price?asset=${coinGeckoId}`,
  );
  console.log(res.status);

  const json = await res.json();
  console.log(json.body.price);

  return new Decimal(json.body.price);
};
export const getForeignAssetPrice = async (foreignAsset: ForeignAssetId) => {
  const coinGeckoId =
    FOREIGN_ASSET_METADATA[foreignAsset.ForeignAsset].coinGeckoId;

  const response = await fetch(`/api/usd-price?asset=${coinGeckoId}`);
  const json = await response.json();

  return new Decimal(json.body.price);
};

const getZTGPrice = async (): Promise<Decimal> => {
  try {
    const response = await fetch(`/api/usd-price?asset=zeitgeist`);
    const json = await response.json();
    return new Decimal(json.body.price);
  } catch (err) {
    return new Decimal(0);
  }
};
