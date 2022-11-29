import Decimal from "decimal.js";
import { UseTradeslipItems } from "lib/state/tradeslip/items";
import { itemKey, UseTradeslipState } from "lib/state/tradeslip/state";
import { observer } from "mobx-react";
import TradeSlipContainer from "./TradeSlipBox";

const TradeSlipItemList = observer(
  ({
    items,
    state,
  }: {
    items: UseTradeslipItems;
    state: UseTradeslipState;
  }) => {
    return (
      <div className="py-ztg-20 px-ztg-28 overflow-y-auto w-full">
        {items.items.map((item) => {
          return (
            <TradeSlipContainer
              item={item}
              state={state.get(itemKey(item))}
              onChange={(amount) => {
                items.put({ ...item, amount: amount.toNumber() });
              }}
              value={new Decimal(item.amount)}
              key={`tradeSlipItem${JSON.stringify(item.assetId)}-${
                item.action
              }`}
            />
          );
        })}
      </div>
    );
  },
);

export default TradeSlipItemList;
