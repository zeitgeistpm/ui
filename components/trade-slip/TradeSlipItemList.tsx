import { AssetId } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useTradeSlipState } from "lib/state/TradeSlip";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";
import TradeSlipContainer from "./TradeSlipBox";

const TradeSlipItemList = observer(() => {
  const tradeslip = useTradeSlipState();

  return (
    <div className="py-ztg-20 px-ztg-28 overflow-y-auto w-full">
      {tradeslip.items.map((item) => {
        return (
          <TradeSlipContainer
            item={item}
            onChange={(amount) => {
              tradeslip.put({ ...item, amount: amount.toNumber() });
            }}
            value={new Decimal(item.amount)}
            key={`tradeSlipItem${JSON.stringify(item.assetId)}-${item.action}`}
          />
        );
      })}
    </div>
  );
});

export default TradeSlipItemList;
