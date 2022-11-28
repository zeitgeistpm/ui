import { CategoricalAssetId, ScalarAssetId } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { isEqual } from "lodash";

export type TradeslipItemAction = "buy" | "sell";

export type TradeSlipItem = {
  action: TradeslipItemAction;
  assetId: CategoricalAssetId | ScalarAssetId;
  amount: number;
};

const tradeSlipIsTransactingAtom = atom<boolean>(false);
const tradeSlipItemsAtom = atomWithStorage<TradeSlipItem[]>(
  "trade-slip-items",
  [],
);

export const useTradeSlipAtom = () => {
  const [isTransacting, setIsTransacting] = useAtom(tradeSlipIsTransactingAtom);
  const [items, setItems] = useAtom(tradeSlipItemsAtom);

  const put = (item: TradeSlipItem) => {
    const existing = items.find(({ assetId: asset }) =>
      isEqual(asset, item.assetId),
    );
    if (existing) {
      setItems(
        items.map((cand) =>
          isEqual(item.assetId, cand.assetId) ? item : cand,
        ),
      );
    } else {
      setItems([...items, item]);
    }
  };

  const removeAsset = (asset: TradeSlipItem["assetId"]) => {
    setItems(items.filter((cand) => !isEqual(asset, cand.assetId)));
  };

  const hasAsset = (asset: TradeSlipItem["assetId"]) =>
    Boolean(items.find((cand) => isEqual(cand.assetId, asset)));

  const getByAsset = (asset: TradeSlipItem["assetId"]) =>
    items.find((cand) => isEqual(cand.assetId, asset));

  return {
    isTransacting,
    setIsTransacting,
    items,
    put,
    removeAsset,
    hasAsset,
    getByAsset,
  };
};
