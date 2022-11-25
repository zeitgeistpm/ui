import { TradeSlipItem, useTradeSlipStore } from "lib/stores/TradeSlipStore";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import React, { FC, useEffect, useMemo, useState } from "react";
import MarketStore from "lib/stores/MarketStore";
import { useTradeSlipAtom } from "lib/state/TradeSlip";
import {
  AssetId,
  fromString,
  IOCategoricalAssetId,
} from "@zeitgeistpm/sdk-next";

interface BuySellButtonsProps {
  assetId: AssetId;
  disabled?: boolean;
}

const BuySellButtons = observer(
  ({ assetId, disabled }: BuySellButtonsProps) => {
    // const tradeSlipStore = useTradeSlipStore();

    // const marketsStore = useMarketsStore();
    // const [marketStore, setMarketStore] = useState<MarketStore>();
    // const { txInProgress } = tradeSlipStore;

    // const buttonsDisabled = useMemo<boolean>(() => {
    //   if (disabled === true) {
    //     return disabled;
    //   }
    //   return marketStore?.tradingEnabled === false || txInProgress;
    // }, [marketStore?.tradingEnabled, txInProgress, disabled]);

    // const tradeSlipItem = useMemo<TradeSlipItem | undefined>(() => {
    //   return tradeSlipStore.findItemWithAssetId(item.assetId);
    // }, [tradeSlipStore.tradeSlipItems, item]);

    // const assetActiveInTradeSlip = useMemo<boolean>(() => {
    //   return tradeSlipStore.assetActive(item.assetId);
    // }, [tradeSlipItem]);

    // const assetTypeActive = useMemo<"buy" | "sell" | undefined>(() => {
    //   if (!assetActiveInTradeSlip) {
    //     return;
    //   }
    //   return tradeSlipItem.type;
    // }, [assetActiveInTradeSlip, tradeSlipItem]);

    // const setMarket = async () => {
    //   const market = await marketsStore.getMarket(item.marketId);
    //   setMarketStore(market);
    // };

    // useEffect(() => {
    //   if (item == null || store.sdk == null) {
    //     return;
    //   }
    //   if (item.assetId == null) {
    //     return;
    //   }
    //   setMarket();
    // }, [item, item.assetId, store.sdk]);

    // const addItem = async (
    //   item: Omit<TradeSlipItem, "type">,
    //   type: "buy" | "sell",
    // ) => {
    //   if (store.rightDrawerClosed) {
    //     store.toggleDrawer("right");
    //   }
    //   const newItem = { ...item, type };
    //   tradeSlipStore.addItem(newItem);
    //   await tradeSlipStore.setFocusedAssetId(newItem);
    // };

    // const changeItem = async (
    //   item: Omit<TradeSlipItem, "type">,
    //   type: "buy" | "sell",
    //   idx: number,
    // ) => {
    //   if (store.rightDrawerClosed) {
    //     store.toggleDrawer("right");
    //   }
    //   const newItem = { ...item, type };
    //   tradeSlipStore.changeItemAtIndex(newItem, idx);
    //   await tradeSlipStore.setFocusedAssetId(newItem);
    // };

    // const handleClick = async (type: "buy" | "sell") => {
    //   tradeSlipStore.unfocusItem();
    //   const asset = tradeSlipItem;
    //   if (asset == null) {
    //     addItem(item, type);
    //   } else {
    //     if (asset.type === type) {
    //       tradeSlipStore.removeItemWithAssetId(item.assetId);
    //     } else if (asset.type !== type) {
    //       const idxInStore = tradeSlipStore.findIndexWithAssetId(asset?.assetId);
    //       changeItem(item, type, idxInStore);
    //     }
    //   }
    // };

    const tradeslip = useTradeSlipAtom();
    const isDisabled = false;

    if (
      !IOCategoricalAssetId.is(assetId) ||
      !IOCategoricalAssetId.is(assetId)
    ) {
      console.warn(
        "Non categorical or scalar asset id passed to BuySellButtons",
      );
      return null;
    }

    return (
      <div className="card-exp-col-6 flex items-center justify-evenly gap-x-[6px]">
        <TradeButton
          active={tradeslip.has({ asset: assetId, action: "buy" })}
          type="buy"
          disabled={isDisabled}
          onClick={() => {
            if (tradeslip.has({ asset: assetId, action: "buy" })) {
              return tradeslip.remove(assetId);
            }
            tradeslip.put({ asset: assetId, action: "buy" });
          }}
        >
          Buy
        </TradeButton>
        <TradeButton
          active={tradeslip.has({ asset: assetId, action: "sell" })}
          disabled={isDisabled}
          type="sell"
          onClick={() => {
            if (tradeslip.has({ asset: assetId, action: "sell" })) {
              return tradeslip.remove(assetId);
            }
            tradeslip.put({ asset: assetId, action: "sell" });
          }}
        >
          Sell
        </TradeButton>
      </div>
    );
  },
);

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
