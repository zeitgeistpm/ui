import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { observer } from "mobx-react";
import { useObservable } from "lib/hooks";
import TradeSlipContainer from "./TradeSlipBox";
import { useTradeSlipStore } from "lib/stores/TradeSlipStore";
import { useTradeSlipAtom } from "lib/state/TradeSlip";
import Decimal from "decimal.js";

const TradeSlipItemList = observer(() => {
  const tradeslip = useTradeSlipAtom();

  return (
    <div className="py-ztg-20 px-ztg-28 overflow-y-auto w-full">
      {tradeslip.items.map((item, index) => {
        return (
          <TradeSlipContainer
            assetId={item.asset}
            onChange={() => {}}
            type={item.action}
            value={new Decimal(0)}
            key={`tradeSlipItem${JSON.stringify(item.asset)}-${item.action}`}
          />
        );
      })}
    </div>
  );
});

// const tradeSlipItemsContainer = useRef<HTMLDivElement>();
//   const tradeSlipStore = useTradeSlipStore();
//   const { tradeSlipItems } = tradeSlipStore;
//   const [tradeSlipContainerScrollbar, setTradeSlipContainerScrollbar] =
//     useState(0);

//   const calcScrollbar = () => {
//     const container = tradeSlipItemsContainer.current;
//     if (container == null) {
//       return;
//     }
//     const { scrollWidth, offsetWidth } = container;
//     const scrollbarWidth = offsetWidth - scrollWidth;
//     setTradeSlipContainerScrollbar(scrollbarWidth);
//   };

//   useObservable(
//     tradeSlipStore.recheckScrollbar.asObservable(),
//     calcScrollbar,
//     [],
//     30,
//   );

//   useEffect(() => {
//     tradeSlipStore.recheckScrollbar.next();
//   }, [tradeSlipItems.length]);

//   const tradeSlipContainerStyle = useMemo<CSSProperties>(() => {
//     const container = tradeSlipItemsContainer.current;
//     const hasScrollbar = tradeSlipContainerScrollbar > 0;
//     if (hasScrollbar) {
//       const paddRight = parseInt(
//         window.getComputedStyle(container).paddingRight,
//       );
//       return { paddingRight: paddRight - tradeSlipContainerScrollbar };
//     }
//     return { paddingRight: 28 };
//   }, [tradeSlipContainerScrollbar]);

export default TradeSlipItemList;
