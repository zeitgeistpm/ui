import { BaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { COIN_GECKO_API_KEY, environment } from "lib/constants";
import { FOREIGN_ASSET_METADATA } from "lib/constants/foreign-asset";

export type BasePrices = {
  [key: string | "ztg"]: [number, number][];
};

/**
 * Look up price for a given asset that is nearest to the given timestamp
 */
export const lookupPrice = (
  basePrices: BasePrices,
  baseAsset: BaseAssetId,
  timestamp: number,
) => {
  //BSR has been live before some assets existed, so no price data is available
  if (environment === "staging") return 1;
  const prices = IOForeignAssetId.is(baseAsset)
    ? basePrices[baseAsset.ForeignAsset]
    : basePrices["ztg"];

  return findPrice(timestamp, prices);
};

/**
 * Get Historical prices of all base assets
 */
export const getBaseAssetHistoricalPrices = async (): Promise<BasePrices> => {
  const coinGeckoIds = [
    ...Object.values(FOREIGN_ASSET_METADATA).map((asset) => asset.coinGeckoId),
    "zeitgeist",
  ];

  const generateUrl = COIN_GECKO_API_KEY
    ? (id: string) =>
        `https://pro-api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=10000&x_cg_pro_api_key=${COIN_GECKO_API_KEY}`
    : (id: string) =>
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=10000`;

  const pricesRes = await Promise.all(
    coinGeckoIds.map((id) => fetch(generateUrl(id))),
  );

  const prices = await Promise.all(
    pricesRes.map(async (res, index) => {
      const id = coinGeckoIds[index];
      if (!res.ok) {
        console.error(`Failed to fetch price data for ${id}: ${res.statusText}`);
        return { prices: [] };
      }
      try {
        return await res.json();
      } catch (e) {
        console.error(`Failed to parse price data for ${id}: ${e}`);
        return { prices: [] };
      }
    })
  );
  const assetIds = Object.keys(FOREIGN_ASSET_METADATA);

  const pricesObj = prices.reduce<BasePrices>((obj, assetPrices, index) => {
    obj[assetIds[index]] = assetPrices.prices;
    return obj;
  }, {});

  pricesObj["ztg"] = prices.at(-1).prices;

  return pricesObj;
};

const findPrice = (timestamp: number, prices: [number, number][]) => {
  const date = new Date(Number(timestamp));

  const price = prices?.find((p) => {
    return datesAreOnSameDay(date, new Date(p[0]));
  });

  return price?.[1];
};

const datesAreOnSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();
