import { ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";

export const calcLiqudityFromPoolAssets = (
  assets: { price: string | number; amountInPool: string | number }[],
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
