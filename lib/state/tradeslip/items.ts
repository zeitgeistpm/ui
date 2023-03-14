import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { isEqual } from "lodash-es";
import { CategoricalAssetId, ScalarAssetId } from "@zeitgeistpm/sdk-next";

/**
 * An item in the tradeslip list.
 */
export type TradeSlipItem = {
  action: "buy" | "sell";
  assetId: CategoricalAssetId | ScalarAssetId;
  amount: number;
};

export type UseTradeslipItems = {
  /**
   * The items added by the user using the `put` method.
   * Rendered in the right drawer.
   * @persistent - local
   */
  items: TradeSlipItem[];
  /**
   * Put(new or update by assetId) item to the items list.
   * @note If the asset id matches the item will be updated with new value and/or action type.
   */
  put: (item: TradeSlipItem) => void;
  /**
   * Remove item from the items list by its AssetId.
   */
  removeAsset: (asset: TradeSlipItem["assetId"]) => void;
  /**
   * Check if the state has an item by its AssetId.
   */
  hasAsset: (asset: TradeSlipItem["assetId"]) => boolean;
  /**
   * Get an item by its AssetId.
   */
  getByAsset: (asset: TradeSlipItem["assetId"]) => TradeSlipItem;
  /**
   * Clear all items.
   */
  clear: () => void;

  slice: (start: number, end?: number) => void;
};

/**
 * Atom storage for tradeslip items.
 *
 * @persistent - local
 */
const tradeSlipItemsAtom = atomWithStorage<TradeSlipItem[]>(
  "trade-slip-items",
  [],
);

export const useTradeslipItems = (): UseTradeslipItems => {
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

  const getByAsset = (asset: TradeSlipItem["assetId"]) =>
    items.find((cand) => isEqual(cand.assetId, asset));

  const hasAsset = (asset: TradeSlipItem["assetId"]) =>
    Boolean(getByAsset(asset));

  const clear = () => setItems([]);

  const slice = (start: number, end?: number) =>
    setItems(items.slice(start, end));

  return {
    items,
    put,
    removeAsset,
    getByAsset,
    hasAsset,
    clear,
    slice,
  };
};
