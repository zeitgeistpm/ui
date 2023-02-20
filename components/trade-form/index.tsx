import { Tab } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useTrade, useTradeItemState } from "lib/hooks/trade";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { TradeType } from "lib/types";
import { extractIndexFromErrorHex } from "lib/util/error-table";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { capitalize } from "lodash";
import { from } from "rxjs";
import { useDebounce } from "use-debounce";
import RangeInput, { AmountInput } from "../ui/inputs";
import TransactionButton from "../ui/TransactionButton";

const TradeTab: FC<PropsWithChildren<{ selected: boolean }>> = React.forwardRef(
  (
    { children, selected, ...rest },
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const classes = `block cursor-pointer h-full center w-1/2 outline-0 text-ztg-18-150 ${
      selected ? "bg-white font-bold" : "bg-anti-flash-white"
    }`;
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);

enum TradeTabType {
  Buy = 0,
  Sell = 1,
}

const TradeForm = observer(() => {
  const notificationStore = useNotificationStore();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [percentage, setPercentage] = useState<string>("0");
  const [percentageDisplay, setPercentageDisplay] = useState<string>("0");
  const store = useStore();
  const { wallets } = store;
  const signer = wallets.getActiveSigner();
  const [fee, setFee] = useState<string>("0");
  const [inputFocused, setInputFocused] = useState<boolean>(false);

  const { data: tradeItem, set: setTradeItem } = useTrade();
  const [inputAmount, setInputAmount] = useState<string>(
    () => tradeItem.baseAmount?.toFixed(4) ?? "0.00",
  );

  const { data: trade } = useTradeItemState(tradeItem);

  const baseSymbol = trade?.market.pool.baseAsset.toUpperCase();

  useEffect(() => {
    if (trade == null) {
      return;
    }
    const percDecimal = new Decimal(percentage).div(100);
    const baseAmount = percDecimal
      .mul(trade.maxBaseAmount)
      .div(ZTG)
      .toDecimalPlaces(4, Decimal.ROUND_DOWN);
    setInputAmount(baseAmount.toString());
    setTradeItem({ ...tradeItem, baseAmount: baseAmount.mul(ZTG) });
  }, [percentage]);

  useEffect(() => {
    if (inputFocused || trade == null || inputAmount === "") {
      return;
    }
    let percDecimal = new Decimal(tradeItem.baseAmount ?? 0).div(
      trade.maxBaseAmount ?? 0,
    );
    if (percDecimal.isNaN()) {
      percDecimal = new Decimal(0);
    }
    setTradeItem({
      ...tradeItem,
      baseAmount: new Decimal(inputAmount).mul(ZTG),
    });
    setPercentageDisplay(percDecimal.mul(100).toFixed(0));
  }, [trade, inputFocused, inputAmount]);

  const type: TradeType = tabIndex === 0 ? "buy" : "sell";

  const processTransaction = async () => {
    try {
      await signAndSend(
        trade.transaction,
        signer,
        extrinsicCallback({
          notificationStore,
          successCallback: () => {
            notificationStore.pushNotification(
              `Successfully ${
                tradeItem.action === "buy" ? "bought" : "sold"
              } ${trade.assetAmount.div(ZTG).toFixed(2)} ${
                trade.asset.category.ticker
              } for ${trade.baseAmount.div(ZTG).toFixed(2)} ${baseSymbol}`,
              { type: "Success" },
            );
            setInputAmount("0.00");
          },
          failCallback: ({ index, error }) => {
            const { errorName } = store.sdk.errorTable.getEntry(
              index,
              extractIndexFromErrorHex(error),
            );
            notificationStore.pushNotification(
              `Trade failed: ${errorName} - ${trade.asset.category.ticker}`,
              {
                type: "Error",
              },
            );
          },
        }),
      );
    } catch (err) {
      console.warn(err);
      notificationStore.pushNotification("Transaction canceled", {
        type: "Info",
      });
    }
  };

  const [debouncedTrade] = useDebounce(JSON.stringify(trade), 500);

  useEffect(() => {
    if (trade == null || trade.transaction == null) {
      return;
    }
    const sub = from(trade.transaction.paymentInfo(signer.address)).subscribe(
      (fee) => {
        setFee(new Decimal(fee.partialFee.toString()).div(ZTG).toFixed(3));
      },
    );
    return () => sub.unsubscribe();
  }, [debouncedTrade]);

  return (
    <>
      <div className={`bg-white`}>
        <Tab.Group
          defaultIndex={0}
          onChange={(index: TradeTabType) => {
            setTabIndex(index);
            if (index === TradeTabType.Buy) {
              setTradeItem({
                ...tradeItem,
                action: "buy",
              });
            }
            if (index === TradeTabType.Sell) {
              setTradeItem({
                ...tradeItem,
                action: "sell",
              });
            }
            setInputAmount("0.00");
          }}
          selectedIndex={tabIndex}
        >
          <Tab.List className="flex justify-between h-[71px] text-center mb-[20px]">
            <Tab as={TradeTab} selected={type === "buy"}>
              Buy
            </Tab>
            <Tab as={TradeTab} selected={type === "sell"}>
              Sell
            </Tab>
          </Tab.List>
        </Tab.Group>
        <div className="flex flex-col mx-[30px]">
          <div className="center h-[87px]" style={{ fontSize: "58px" }}>
            {trade?.assetAmount?.div(ZTG).toFixed(2) ?? "0.00"}
          </div>
          <div
            className="center h-[48px] font-semibold"
            style={{ fontSize: "28px" }}
          >
            {trade?.asset.category.name}
          </div>
          <div className="font-semibold text-center mb-[20px]">For</div>
          <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 mb-[20px]">
            <input
              type="number"
              value={inputAmount}
              max={trade?.maxBaseAmount?.div(ZTG).toFixed(4)}
              min="0"
              className="w-full bg-transparent outline-none !text-center"
              onFocus={() => setInputFocused(true)}
              onBlur={() => {
                const maxBaseDecimal = new Decimal(
                  trade?.maxBaseAmount ?? 0,
                ).div(ZTG);
                const val = inputAmount === "" ? "0" : inputAmount;
                if (maxBaseDecimal.lte(val)) {
                  setInputAmount(
                    maxBaseDecimal
                      .toDecimalPlaces(4, Decimal.ROUND_DOWN)
                      .toString(),
                  );
                } else if (inputAmount === "") {
                  setInputAmount("0");
                }
                setInputFocused(false);
              }}
              onChange={(e) => {
                if (inputFocused) {
                  setInputAmount(e.target.value);
                }
              }}
            />
            <div className="mr-[10px]">{baseSymbol}</div>
          </div>
          <RangeInput
            max="100"
            min="0"
            minLabel="0 %"
            maxLabel="100 %"
            value={percentageDisplay}
            onValueChange={setPercentage}
            valueSuffix="%"
            className="mb-[20px]"
          />
          <div className="text-center mb-[20px]">
            <div className="text-ztg-14-150">
              <div className="mb-[10px]">
                <span className="text-sky-600">Average Price: </span>
                {trade?.price.toFixed(2)} {baseSymbol}
              </div>
              <div>
                <span className="text-sky-600">Prediction After Buy: </span>
              </div>
              {trade?.priceAfterTrade.toFixed(2)} {baseSymbol}
            </div>
          </div>
          <TransactionButton
            onClick={() => {
              processTransaction();
            }}
            className="h-[56px]"
          >
            <div className="center font-normal h-[20px]">
              Confirm {`${capitalize(tradeItem.action)}`}
            </div>
            <div className="center font-normal text-ztg-12-120 h-[20px]">
              Trading fee: {fee} {baseSymbol}
            </div>
          </TransactionButton>
        </div>
      </div>
    </>
  );
});
export default TradeForm;
