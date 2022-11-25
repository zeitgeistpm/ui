import { CategoricalAssetId, ScalarAssetId } from "@zeitgeistpm/sdk-next";
import { atom, useAtom } from "jotai";
import { isEqual } from "lodash";

export type TradeslipItemAction = "buy" | "sell";

export type TradeSlipItem = {
  action: TradeslipItemAction;
  asset: CategoricalAssetId | ScalarAssetId;
};

const tradeSlipIsTransactingAtom = atom<boolean>(false);
const tradeSlipItemsAtom = atom<TradeSlipItem[]>([]);

export const useTradeSlipAtom = () => {
  const [isTransacting, setIsTransacting] = useAtom(tradeSlipIsTransactingAtom);
  const [items, setItems] = useAtom(tradeSlipItemsAtom);

  const put = (item: TradeSlipItem) => {
    const existing = items.find(({ asset }) => isEqual(asset, item.asset));
    if (existing) {
      setItems(
        items.map((cand) => (isEqual(item.asset, cand.asset) ? item : cand)),
      );
    } else {
      setItems([...items, item]);
    }
  };

  const remove = (asset: CategoricalAssetId | ScalarAssetId) => {
    setItems(items.filter((cand) => !isEqual(asset, cand.asset)));
  };

  const has = (item: TradeSlipItem) =>
    Boolean(items.find((cand) => isEqual(cand, item)));

  return {
    isTransacting,
    setIsTransacting,
    items,
    put,
    remove,
    has,
  };
};
