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

export const getForeignAssetPriceServerSide = async (
  foreignAsset: ForeignAssetId,
) => {
  const coinGeckoId =
    FOREIGN_ASSET_METADATA[foreignAsset.ForeignAsset].coinGeckoId;

  const res = await fetch(
    `${process?.env?.NEXT_PUBLIC_SITE_URL}/api/usd-price?asset=${coinGeckoId}`,
  );

  const json = await res.json();

  return new Decimal(json[coinGeckoId].usd);
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
