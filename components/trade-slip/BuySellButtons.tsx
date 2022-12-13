import {
  AssetId,
  IOCategoricalAssetId,
  IOScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import { useTradeslipItems } from "lib/state/tradeslip/items";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { FC, useMemo } from "react";

interface BuySellButtonsProps {
  assetId: AssetId;
  disabled?: boolean;
}

const BuySellButtons = observer(
  ({ assetId, disabled }: BuySellButtonsProps) => {
    const store = useStore();
    const tradeslip = useTradeslipItems();
    const isDisabled = false;

    if (!IOCategoricalAssetId.is(assetId) && !IOScalarAssetId.is(assetId)) {
      return null;
    }

    // TODO: Move drawer state to jotai atoms and move should open or not logic there too.
    const openDrawer = () => {
      if (store.rightDrawerClosed) {
        store.toggleDrawer("right");
      }
    };

    const onClickBuy = () => {
      if (tradeslip.getByAsset(assetId)?.action === "buy") {
        return tradeslip.removeAsset(assetId);
      }
      tradeslip.put({
        assetId: assetId,
        action: "buy",
        amount: 0,
      });
      openDrawer();
    };

    const onClickSell = () => {
      if (tradeslip.getByAsset(assetId)?.action === "sell") {
        return tradeslip.removeAsset(assetId);
      }
      tradeslip.put({
        assetId: assetId,
        action: "sell",
        amount: 0,
      });
      openDrawer();
    };

    return (
      <div className="card-exp-col-6 flex items-center justify-evenly gap-x-[6px]">
        <TradeButton
          active={tradeslip.getByAsset(assetId)?.action === "buy"}
          type="buy"
          disabled={isDisabled}
          onClick={onClickBuy}
        >
          Buy
        </TradeButton>
        <TradeButton
          active={tradeslip.getByAsset(assetId)?.action === "sell"}
          disabled={isDisabled}
          type="sell"
          onClick={onClickSell}
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
    "rounded-full h-ztg-20  text-ztg-10-150 w-ztg-47 font-normal flex items-center justify-center focus:outline-none border-2";

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
