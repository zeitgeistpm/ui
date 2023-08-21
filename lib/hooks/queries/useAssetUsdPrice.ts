import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  AssetId,
  IOZtgAssetId,
  IOForeignAssetId,
  ForeignAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import { fetchZTGInfo } from "@zeitgeistpm/utility/dist/ztg";
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

export const getForeignAssetPrice = async (foreignAsset: ForeignAssetId) => {
  const coinGeckoId =
    FOREIGN_ASSET_METADATA[foreignAsset.ForeignAsset].coinGeckoId;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
  );

  const json = await res.json();

  return new Decimal(json[coinGeckoId]?.usd ?? 0);
};

const getZTGPrice = async (): Promise<Decimal> => {
  try {
    const ztgInfo = await fetchZTGInfo();
    window.localStorage.setItem("ztgInfo", JSON.stringify(ztgInfo));
    return ztgInfo.price;
  } catch (err) {
    const ztgInfo = JSON.parse(window.localStorage.getItem("ztgInfo") || "{}");
    if (isEmpty(ztgInfo)) {
      return new Decimal(0);
    } else {
      return ztgInfo.price;
    }
  }
};

export type ZtgPriceHistory = {
  prices: [timestamp: number, price: number][];
};

export const getZTGHistory = async (): Promise<ZtgPriceHistory> => {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/zeitgeist/market_chart?vs_currency=usd&days=7`,
  );
  const data = await response.json();
  return data;
};
