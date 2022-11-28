import Decimal from "decimal.js";
import { useTradeSlipAtom } from "lib/state/TradeSlip";
import { observer } from "mobx-react";
import TradeSlipContainer from "./TradeSlipBox";

const TradeSlipItemList = observer(() => {
  const tradeslip = useTradeSlipAtom();

  return (
    <div className="py-ztg-20 px-ztg-28 overflow-y-auto w-full">
      {tradeslip.items.map((item) => {
        return (
          <TradeSlipContainer
            item={item}
            onChange={(amount) => {
              tradeslip.put({ ...item, amount });
            }}
            value={item.amount}
            key={`tradeSlipItem${JSON.stringify(item.assetId)}-${item.action}`}
          />
        );
      })}
    </div>
  );
});

export default TradeSlipItemList;
