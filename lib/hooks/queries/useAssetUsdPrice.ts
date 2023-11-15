import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  AssetId,
  ForeignAssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { environment } from "lib/constants";
import { FOREIGN_ASSET_METADATA } from "lib/constants/foreign-asset";

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
  const zeitgeistCoingeckoId = "zeitgeist";
  const coinGeckoIds = [
    ...Object.values(FOREIGN_ASSET_METADATA).map((asset) => asset.coinGeckoId),
    zeitgeistCoingeckoId,
  ];

  console.log(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(
      "%2C",
    )}&vs_currencies=usd`,
  );
  // const res = await fetch(
  //   `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(
  //     "%2C",
  //   )}&vs_currencies=usd`,
  // );

  // const json = await res.json();

  // const assetPrices = Object.keys(
  //   FOREIGN_ASSET_METADATA,
  // ).reduce<ForeignAssetPrices>((prices, assetNumber) => {
  //   const assetMetadata = FOREIGN_ASSET_METADATA[Number(assetNumber)];
  //   const coinGeckoId = assetMetadata.coinGeckoId;
  //   const assetPrice = json[coinGeckoId].usd;
  //   prices[assetNumber] = new Decimal(assetPrice);

  //   console.log(prices);

  //   return prices;
  // }, {});

  // assetPrices["ztg"] = json[zeitgeistCoingeckoId].usd;
  // console.log(assetPrices);

  return {
    "0": new Decimal(5.39),
    "1": new Decimal(5.39),
    "3": new Decimal(5.39),
    ztg: new Decimal(0.03269525),
  };
};

export const getForeignAssetPriceServerSide = async (
  foreignAsset: ForeignAssetId,
) => {
  const coinGeckoId =
    FOREIGN_ASSET_METADATA[foreignAsset.ForeignAsset].coinGeckoId;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
  );

  const json = await res.json();
  console.log(json);
  return new Decimal(json[coinGeckoId]?.usd ?? 0);
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

export type ZtgPriceHistory = {
  prices: [timestamp: number, price: number][];
};

export const getZTGHistory = async (): Promise<ZtgPriceHistory> => {
  if (environment === "staging") {
    return {
      prices: [
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
      ],
    };
  }
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/zeitgeist/market_chart?vs_currency=usd&days=7&interval=daily`,
  );
  const data = await response.json();
  return data;
};
