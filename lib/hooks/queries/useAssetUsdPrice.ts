import { useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOZtgAssetId,
  IOForeignAssetId,
  ForeignAssetId,
} from "@zeitgeistpm/sdk-next";
import { fetchZTGInfo } from "@zeitgeistpm/utility/dist/ztg";
import Decimal from "decimal.js";
import { FORIEGN_ASSET_METADATA } from "lib/constants/foreign-asset";
import { isEmpty } from "lodash";

export const assetUsdPriceRootKey = "asset-usd-price";

export const useAssetUsdPrice = (assetId: AssetId) => {
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

const getForeignAssetPrice = async (foreignAsset: ForeignAssetId) => {
  const coinGeckoId =
    FORIEGN_ASSET_METADATA[foreignAsset.ForeignAsset].coinGeckoId;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
  );

  const json = await res.json();

  return new Decimal(json[coinGeckoId].usd);
};

const getZTGPrice = async () => {
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
