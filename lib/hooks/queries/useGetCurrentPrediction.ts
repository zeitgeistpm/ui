import {
  calcSpotPrice,
  FullContext,
  getIndexOf,
  getScalarBounds,
  IOMarketOutcomeAssetId,
  Market,
} from "@zeitgeistpm/sdk-next";
import { useQuery } from "@tanstack/react-query";
import { useSdkv2 } from "../useSdkv2";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";

export const useGetCurrentPrediction = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const getAssets = async () => {
    const market: Market<FullContext> = await sdk.model.markets
      .get({ marketId })
      .then((market) => market.unwrap()!);

    const pool = await sdk.model.swaps
      .getPool({ marketId })
      .then((pool) => pool.unwrap()!);

    const assets = pool
      .getAssetIds()
      .filter(IOMarketOutcomeAssetId.is.bind(IOMarketOutcomeAssetId));

    const poolBaseAssetBalance = await pool.getAssetBalance({ Ztg: null });
    const poolBaseAssetWeight = await pool
      .getAssetWeight({ Ztg: null })
      .unwrap()!;

    const assetPrices = await Promise.all(
      assets.map(async (asset) => {
        const assetBalance = await pool.getAssetBalance(asset);
        const assetWeight = pool.getAssetWeight(asset).unwrap()!;
        const category = market.categories?.[getIndexOf(asset as any)];

        const price = calcSpotPrice(
          poolBaseAssetBalance,
          poolBaseAssetWeight,
          assetBalance,
          assetWeight,
          0,
        );

        return {
          name: category?.name ?? asset.toString(),
          price,
        };
      }),
    );
    const predictedPrice = assetPrices
      .sort((a, b) => (a.price.gt(b.price) ? -1 : 1))
      .at(0)!;

    if (market.marketType.scalar) {
      const [lower, upper] = getScalarBounds(market).unwrap()!;
      const predictedValue = upper
        .minus(lower)
        .mul(predictedPrice.price)
        .plus(lower);
      return { name: predictedPrice.name, price: predictedValue.toFixed(2) };
    } else {
      return {
        name: predictedPrice.name,
        price: predictedPrice.price.toString(),
      };
    }
  };

  const query = useQuery(
    [id, marketId],
    async () => {
      if (sdk && isRpcSdk(sdk) && marketId) {
        return await getAssets();
      }
      return null;
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && marketId),
    },
  );

  return query;
};
