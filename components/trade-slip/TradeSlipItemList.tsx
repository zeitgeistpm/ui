import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { observer } from "mobx-react";
import { useObservable } from "lib/hooks";
import TradeSlipBox from "./TradeSlipBox";
import { useTradeSlipStore } from "lib/stores/TradeSlipStore";

const TradeSlipItemList = observer(() => {
  const tradeSlipItemsContainer = useRef<HTMLDivElement>();
  const tradeSlipStore = useTradeSlipStore();
  const { tradeSlipItems } = tradeSlipStore;
  const [tradeSlipContainerScrollbar, setTradeSlipContainerScrollbar] =
    useState(0);

  const calcScrollbar = () => {
    const container = tradeSlipItemsContainer.current;
    if (container == null) {
      return;
    }
    const { scrollWidth, offsetWidth } = container;
    const scrollbarWidth = offsetWidth - scrollWidth;
    setTradeSlipContainerScrollbar(scrollbarWidth);
  };

  useObservable(
    tradeSlipStore.recheckScrollbar.asObservable(),
    calcScrollbar,
    [],
    30
  );

  useEffect(() => {
    tradeSlipStore.recheckScrollbar.next();
  }, [tradeSlipItems.length]);

  const tradeSlipContainerStyle = useMemo<CSSProperties>(() => {
    const container = tradeSlipItemsContainer.current;
    const hasScrollbar = tradeSlipContainerScrollbar > 0;
    if (hasScrollbar) {
      const paddRight = parseInt(
        window.getComputedStyle(container).paddingRight
      );
      return { paddingRight: paddRight - tradeSlipContainerScrollbar };
    }
    return { paddingRight: 28 };
  }, [tradeSlipContainerScrollbar]);

  return (
    <div
      className="py-ztg-20 px-ztg-28 overflow-y-auto w-full"
      ref={tradeSlipItemsContainer}
      style={tradeSlipContainerStyle}
    >
      {tradeSlipItems.map((item, index) => {
        const state = tradeSlipStore.getBoxState(index);
        return (
          <TradeSlipBox
            state={state}
            onClose={() => {
              tradeSlipStore.removeItemAtIndex(index);
            }}
            key={`tradeSlipItem${JSON.stringify(item.assetId)}-${item.type}`}
          />
        );
      })}
    </div>
  );
});

export default TradeSlipItemList;
