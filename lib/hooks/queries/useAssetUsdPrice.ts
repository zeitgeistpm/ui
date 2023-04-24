import { useQuery } from "@tanstack/react-query";
import { AssetId, IOZtgAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk-next";
import { fetchZTGInfo } from "@zeitgeistpm/utility/dist/ztg";
import Decimal from "decimal.js";
import { FORIEGN_ASSET_METADATA } from "lib/constants/foreign-asset";

export const assetUsdPriceRootKey = "asset-usd-price";

export const useAssetUsdPrice = (assetId: AssetId) => {
  const query = useQuery(
    [assetUsdPriceRootKey, assetId],
    async () => {
      if (IOZtgAssetId.is(assetId)) {
        //todo: is there a way to use the cache for this
        const ztgInfo = await fetchZTGInfo();
        return ztgInfo.price;
      } else if (IOForeignAssetId.is(assetId)) {
        return getForeignAssetPrice(assetId.ForeignAsset);
      }
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

const getForeignAssetPrice = async (number: number) => {
  //todo: why are the types broken?
  const coinGeckoId = FORIEGN_ASSET_METADATA[number].coinGeckoId;
  console.log(coinGeckoId);
  console.log(number);

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
  );

  const json = await res.json();
  console.log(json);

  return new Decimal(json[coinGeckoId].usd);
};
