import { TradeSlipItem, useTradeSlipStore } from "lib/stores/TradeSlipStore";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import React, { FC, useEffect, useMemo, useState } from "react";
import MarketStore from "lib/stores/MarketStore";

interface BuySellButtonsProps {
  item: Omit<TradeSlipItem, "type">;
}

const BuySellButtons = observer(({ item }: BuySellButtonsProps) => {
  const tradeSlipStore = useTradeSlipStore();
  const store = useStore();
  const marketsStore = useMarketsStore();
  const [marketStore, setMarketStore] = useState<MarketStore>();
  const { txInProgress } = tradeSlipStore;

  const buttonsDisabled = useMemo<boolean>(() => {
    return marketStore?.tradingEnabled === false || txInProgress;
  }, [marketStore?.tradingEnabled, txInProgress]);

  const tradeSlipItem = useMemo<TradeSlipItem | undefined>(() => {
    return tradeSlipStore.findItemWithAssetId(item.assetId);
  }, [tradeSlipStore.tradeSlipItems, item]);

  const assetActiveInTradeSlip = useMemo<boolean>(() => {
    return tradeSlipStore.assetActive(item.assetId);
  }, [tradeSlipItem]);

  const assetTypeActive = useMemo<"buy" | "sell" | undefined>(() => {
    if (!assetActiveInTradeSlip) {
      return;
    }
    return tradeSlipItem.type;
  }, [assetActiveInTradeSlip, tradeSlipItem]);

  const setMarket = async () => {
    const market = await marketsStore.getMarket(item.marketId);
    setMarketStore(market);
  };

  useEffect(() => {
    item != null && setMarket();
  }, [item]);

  const addItem = async (
    item: Omit<TradeSlipItem, "type">,
    type: "buy" | "sell",
  ) => {
    if (store.rightDrawerClosed) {
      store.toggleDrawer("right");
    }
    const newItem = { ...item, type };
    tradeSlipStore.addItem(newItem);
    await tradeSlipStore.setFocusedAssetId(newItem);
  };

  const changeItem = async (
    item: Omit<TradeSlipItem, "type">,
    type: "buy" | "sell",
    idx: number,
  ) => {
    if (store.rightDrawerClosed) {
      store.toggleDrawer("right");
    }
    const newItem = { ...item, type };
    tradeSlipStore.changeItemAtIndex(newItem, idx);
    await tradeSlipStore.setFocusedAssetId(newItem);
  };

  const handleClick = async (type: "buy" | "sell") => {
    tradeSlipStore.unfocusItem();
    const asset = tradeSlipItem;
    if (asset == null) {
      addItem(item, type);
    } else {
      if (asset.type === type) {
        tradeSlipStore.removeItemWithAssetId(item.assetId);
      } else if (asset.type !== type) {
        const idxInStore = tradeSlipStore.findIndexWithAssetId(asset?.assetId);
        changeItem(item, type, idxInStore);
      }
    }
  };

  return (
    <div className="card-exp-col-6 flex items-center justify-evenly">
      <TradeButton
        active={assetActiveInTradeSlip && assetTypeActive === "buy"}
        type="buy"
        disabled={buttonsDisabled}
        onClick={() => {
          handleClick("buy");
        }}
      >
        Buy
      </TradeButton>
      <TradeButton
        active={assetActiveInTradeSlip && assetTypeActive === "sell"}
        disabled={buttonsDisabled}
        type="sell"
        onClick={() => {
          handleClick("sell");
        }}
      >
        Sell
      </TradeButton>
    </div>
  );
});

const TradeButton: FC<{
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
  type: "buy" | "sell";
}> = observer(({ onClick, active, type, children, disabled = false }) => {
  const defaultClass =
    "rounded-full h-ztg-20 font-space text-ztg-10-150 w-ztg-47 font-normal flex items-center justify-center focus:outline-none border-2";

  const classes = useMemo(() => {
    if (disabled) {
      return `${defaultClass} text-sky-600 borer-sky-600 disabled:cursor-default`;
    }

    if (active) {
      const activeClass = "text-white dark:text-black";
      return type === "buy"
        ? `${defaultClass} ${activeClass} bg-sunglow-2 border-sunglow-2`
        : `${defaultClass} ${activeClass} bg-vermilion border-vermilion`;
    } else {
      return `${defaultClass} border-black text-black dark:border-white dark:text-white`;
    }
  }, [active, disabled]);

  const click = () => {
    onClick();
  };

  return (
    <button className={classes} onClick={click} disabled={disabled}>
      {children}
    </button>
  );
});

export default BuySellButtons;
