import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import { ZTG } from "@zeitgeistpm/sdk-next";

export const rootKey = "total-liquidity";

const calcLiqudity = (
  assets: { price: string | number; amountInPool: any }[],
) => {
  return assets.reduce((total, asset) => {
    if (!asset.price || !asset.amountInPool) {
      return total;
    }
    const price = new Decimal(asset.price);
    return total.plus(
      new Decimal(price.div(ZTG)).mul(new Decimal(asset.amountInPool)),
    );
  }, new Decimal(0));
};

export const useTotalLiquidity = () => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, rootKey],
    async () => {
      const pools = await sdk.model.swaps.listPools({});
      const total =
        pools?.reduce((acc, pool) => {
          return acc.plus(calcLiqudity(pool.assets as any));
        }, new Decimal(0)) ?? new Decimal(0);

      return total;
    },
    {
      enabled: Boolean(sdk),
    },
  );
};
